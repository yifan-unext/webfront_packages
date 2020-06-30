import axios from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { NextPageContext } from 'next';

const PRODUCTION_URL = 'https://oauth.unext.jp';
const DEVELOPMENT_URL = 'https://oauth.wf.unext.dev';
const OFFLINE_SCOPE = 'offline';

const transformRequest = (jsonData: Record<string, string> = {}) =>
  Object.entries(jsonData)
    .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
    .join('&');

export interface CookieMaxAges {
  accessTokenMaxAge: number;
  refreshTokenMaxAge: number;
}

export interface CookieExpires {
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

export interface MigrateOptions {
  url?: string;
  env?: 'production';
  clientId: string;
  clientSecret: string;
  cookieDomain: string;
  cookieTTLs: CookieExpires | CookieMaxAges;
  cookiePath?: string;
  scopes: string[];
}

export enum MigrateStatus {
  NONE = 'none',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface MigrateResult {
  status: MigrateStatus;
  accessToken?: string;
}

const getOAuthURL = (options: MigrateOptions) => {
  if (options.url) {
    return options.url;
  }

  switch (options.env) {
    case 'production':
      return PRODUCTION_URL;
    default:
      return DEVELOPMENT_URL;
  }
};

const isCookieMaxAges = (
  cookieTTLs: CookieExpires | CookieMaxAges
): cookieTTLs is CookieMaxAges => 'accessTokenMaxAge' in cookieTTLs;

const migrateTokens = async (
  ctx: NextPageContext,
  options: MigrateOptions
): Promise<MigrateResult> => {
  if (!options) {
    throw new Error('migrateTokens: no options provided');
  }

  if (!options.clientId || !options.clientSecret) {
    throw new Error('migrateTokens: no clientId/clientSecret provided');
  }

  axios.defaults.baseURL = getOAuthURL(options);
  const isProd = options.env === 'production';

  try {
    const cookies = parseCookies(ctx);

    let securityToken = cookies['_st'];
    const accessToken = cookies['_at'];

    if (securityToken && !accessToken) {
      /**
       * If the securityToken matches the below regex, it is serialized
       * by the Yii framework and we will parse it and override the securityToken
       * with the parsed value.
       */
      const parsedSt = cookies['_st'].match(
        /([a-z0-9]+)a:2(.*)s:[0-9]{2}:"([a-z0-9-]+)";}/
      );
      if (parsedSt && parsedSt[3]) {
        securityToken = parsedSt[3];
      }

      const scope = [...options.scopes];
      if (scope.indexOf(OFFLINE_SCOPE) === -1) {
        scope.push(OFFLINE_SCOPE);
      }
      const response = await axios.post('/oauth2/migration', {
        client_id: options.clientId,
        scope,
        portal_user_info: {
          securityToken,
        },
      });

      if (response.data?.auth_code) {
        const data = {
          grant_type: 'authorization_code',
          code: response.data.auth_code,
          redirect_uri: response.data.redirect_uri,
          client_id: options.clientId,
          client_secret: options.clientSecret,
        };

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        const exchange = await axios.post(
          '/oauth2/token',
          transformRequest(data),
          { headers }
        );

        if (exchange.data?.access_token) {
          const {
            access_token: accessToken,
            refresh_token: refreshToken,
          } = exchange.data;
          const commonCookieOptions = {
            secure: isProd,
            httpOnly: true,
            path: options.cookiePath || '/',
            domain: options.cookieDomain,
          };
          if (isCookieMaxAges(options.cookieTTLs)) {
            const {
              accessTokenMaxAge,
              refreshTokenMaxAge,
            } = options.cookieTTLs;
            setCookie(ctx, '_at', accessToken, {
              ...commonCookieOptions,
              maxAge: accessTokenMaxAge,
            });
            setCookie(ctx, '_rt', refreshToken, {
              ...commonCookieOptions,
              maxAge: refreshTokenMaxAge,
            });
          } else {
            const {
              accessTokenExpires,
              refreshTokenExpires,
            } = options.cookieTTLs;
            setCookie(ctx, '_at', accessToken, {
              ...commonCookieOptions,
              expires: accessTokenExpires,
            });
            setCookie(ctx, '_rt', refreshToken, {
              ...commonCookieOptions,
              expires: refreshTokenExpires,
            });
          }
          return {
            status: MigrateStatus.SUCCESS,
            accessToken,
          };
        }
      }
      return { status: MigrateStatus.FAILED };
    }
    return { status: MigrateStatus.NONE };
  } catch (e) {
    return { status: MigrateStatus.FAILED };
  }
};

export default migrateTokens;
