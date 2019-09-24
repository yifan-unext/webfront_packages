import axios from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { NextPageContext } from 'next';

const PRODUCTION_URL = 'https://oauth.unext.jp';
const PRODUCTION_TEST_URL = 'https://oauth-test.unext.jp';

const transformRequest = (jsonData: Record<string, string> = {}) =>
  Object.entries(jsonData)
    .map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
    .join('&');

interface MigrateOptions {
  url?: string;
  env?: 'production';
  cookieMaxAge?: number;
  cookiePath?: string;
  cookieDomain?: string;
}

const getOAuthURL = (options: MigrateOptions) => {
  if (options.url) {
    return options.url;
  }

  switch (options.env) {
    case 'production':
      return PRODUCTION_URL;
    default:
      return PRODUCTION_TEST_URL;
  }
};

export const migrateTokens = async (
  ctx: NextPageContext,
  options: MigrateOptions = {}
) => {
  axios.defaults.baseURL = getOAuthURL(options);
  const isProd = options.env === 'production';

  try {
    const cookies = parseCookies(ctx);

    if (!cookies) {
      return;
    }

    const securityToken = cookies['_st'];
    const accessToken = cookies['_at'];

    if (securityToken && !accessToken) {
      const response = await axios.post('/oauth2/migration', {
        client_id: 'unextApp',
        scope: ['offline'],
        portal_user_info: {
          securityToken,
        },
      });

      if (response.data && response.data.auth_code) {
        const data = {
          grant_type: 'authorization_code',
          code: response.data.auth_code,
          redirect_uri: response.data.redirect_uri,
          client_id: 'unextApp',
          client_secret: 'unextApp',
        };

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        const exchange = await axios.post(
          '/oauth2/token',
          transformRequest(data),
          { headers }
        );

        if (exchange.data && exchange.data.access_token) {
          setCookie(ctx, '_at', exchange.data.access_token, {
            maxAge: options.cookieMaxAge || 60 * 60,
            secure: isProd,
            httpOnly: true,
            path: options.cookiePath || '/',
            domain: options.cookieDomain,
          });
          setCookie(ctx, '_rt', exchange.data.refresh_token, {
            maxAge: options.cookieMaxAge || 60 * 60,
            secure: isProd,
            httpOnly: true,
            path: options.cookiePath || '/',
            domain: options.cookieDomain,
          });
        }
      }
    }
  } catch (e) {
    console.log('Token exchange failed', e.message);
  }
};

export default migrateTokens;
