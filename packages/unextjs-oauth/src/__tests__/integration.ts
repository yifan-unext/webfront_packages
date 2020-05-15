import http, { ServerResponse, IncomingMessage } from 'http';
import { NextPageContext } from 'next';
import { mocked } from 'ts-jest/utils';
import axios from 'axios';
import fetch from 'isomorphic-fetch';
import listen from 'test-listen';
import migrateTokens, { MigrateStatus } from '..';
jest.mock('axios');

type TestExecutor = (ctx: NextPageContext) => Promise<void>;

const runOnTestServer = async (
  executor: TestExecutor,
  done: jest.DoneCallback,
  cookie?: string
) => {
  let error: Error = null;
  const testHandler = async (req: IncomingMessage, res: ServerResponse) => {
    const testContext: NextPageContext = {
      req,
      res,
      AppTree: null,
      query: null,
      pathname: '/',
    };
    try {
      await executor(testContext);
    } catch (e) {
      error = e;
      res.statusCode = 500;
    } finally {
      res.end();
    }
  };
  const testServer = http.createServer(testHandler);
  const testUrl = await listen(testServer);
  const response = await fetch(
    testUrl,
    cookie
      ? {
          headers: {
            cookie,
          },
        }
      : undefined
  );
  if (response.ok) {
    done();
  } else {
    done(error);
  }
  testServer.close();
};

describe('migrateTokens', () => {
  const mockedPost = mocked(axios.post);
  beforeEach(() => {
    mockedPost.mockReset();
  });
  it('throws exception when not passing options', (done) => {
    runOnTestServer(async (ctx) => {
      let error: Error = null;
      try {
        await migrateTokens(ctx, null);
      } catch (e) {
        error = e;
      }
      expect(error?.message).toEqual('migrateTokens: no options provided');
    }, done);
  });
  it('throws exception when not passing options.clientId', (done) => {
    runOnTestServer(async (ctx) => {
      let error: Error = null;
      try {
        await migrateTokens(ctx, { clientId: 'unext', clientSecret: null });
      } catch (e) {
        error = e;
      }
      expect(error?.message).toEqual(
        'migrateTokens: no clientId/clientSecret provided'
      );
    }, done);
  });
  it('throws exception when not passing options.clientSecret', (done) => {
    runOnTestServer(async (ctx) => {
      let error: Error = null;
      try {
        await migrateTokens(ctx, { clientId: null, clientSecret: 'unext' });
      } catch (e) {
        error = e;
      }
      expect(error?.message).toEqual(
        'migrateTokens: no clientId/clientSecret provided'
      );
    }, done);
  });
  it('uses server specified in options.url', (done) => {
    const OAUTH2_TEST_URL = 'https://oauth2.test.com';
    runOnTestServer(async (ctx) => {
      await migrateTokens(ctx, {
        clientId: 'unext',
        clientSecret: 'unext ',
        url: OAUTH2_TEST_URL,
      });
      expect(axios.defaults.baseURL).toBe(OAUTH2_TEST_URL);
    }, done);
  });
  it('uses production oauth2 server for env=production', (done) => {
    runOnTestServer(async (ctx) => {
      await migrateTokens(ctx, {
        clientId: 'unext',
        clientSecret: 'unext ',
        env: 'production',
      });
      expect(axios.defaults.baseURL).toBe('https://oauth.unext.jp');
    }, done);
  });
  it('does nothing if _at cookie pre-exists', (done) => {
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext ',
        });
        expect(status).toBe(MigrateStatus.NONE);
        expect(accessToken).toBeUndefined();
      },
      done,
      '_at=dummy'
    );
  });
  it('does nothing if _st cookie does not exist', (done) => {
    runOnTestServer(async (ctx) => {
      const { status, accessToken } = await migrateTokens(ctx, {
        clientId: 'unext',
        clientSecret: 'unext ',
      });
      expect(status).toBe(MigrateStatus.NONE);
      expect(accessToken).toBeUndefined();
    }, done);
  });
  it('fails if _st cookie is not valid', (done) => {
    mockedPost
      .mockResolvedValueOnce({})
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext ',
          scopes: ['testscope'],
        });
        expect(mockedPost).toBeCalledTimes(1);
        expect(mockedPost.mock.calls[0]).toEqual([
          '/oauth2/migration',
          {
            client_id: 'unext',
            scope: ['offline', 'testscope'],
            portal_user_info: {
              securityToken: 'badtoken',
            },
          },
        ]);
        expect(status).toBe(MigrateStatus.FAILED);
        expect(accessToken).toBeUndefined();
      },
      done,
      '_st=badtoken'
    );
  });
  it('fails if oauth2 server is not reachable', (done) => {
    mockedPost.mockRejectedValue(new Error('Fetch error'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext ',
          scopes: ['testscope'],
        });
        expect(mockedPost).toBeCalledTimes(1);
        expect(mockedPost.mock.calls[0]).toEqual([
          '/oauth2/migration',
          {
            client_id: 'unext',
            scope: ['offline', 'testscope'],
            portal_user_info: {
              securityToken: 'goodtoken',
            },
          },
        ]);
        expect(status).toBe(MigrateStatus.FAILED);
        expect(accessToken).toBeUndefined();
      },
      done,
      '_st=goodtoken'
    );
  });
  it('migrates successfully non-encoded security token', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
        });
        expect(mockedPost).toBeCalledTimes(2);
        expect(mockedPost.mock.calls[0]).toEqual([
          '/oauth2/migration',
          {
            client_id: 'unext',
            scope: ['offline', 'testscope'],
            portal_user_info: {
              securityToken: 'goodtoken',
            },
          },
        ]);
        expect(mockedPost.mock.calls[1]).toEqual([
          '/oauth2/token',
          'grant_type=authorization_code&code=testauthcode&redirect_uri=undefined&client_id=unext&client_secret=unext',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ]);
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
      },
      done,
      '_st=goodtoken'
    );
  });
  it('migrates successfully encoded security token', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
        });
        expect(mockedPost).toBeCalledTimes(2);
        expect(mockedPost.mock.calls[0]).toEqual([
          '/oauth2/migration',
          {
            client_id: 'unext',
            scope: ['offline', 'testscope'],
            portal_user_info: {
              securityToken: 'd17524e1-1c50-4259-a75e-5f90fc4f3835',
            },
          },
        ]);
        expect(mockedPost.mock.calls[1]).toEqual([
          '/oauth2/token',
          'grant_type=authorization_code&code=testauthcode&redirect_uri=undefined&client_id=unext&client_secret=unext',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ]);
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
      },
      done,
      '_st=565f8bfa272d24fda6d0308a58cc990c420263e2f81ebcd55af337468cb1a4a9a%3A2%3A%7Bi%3A0%3Bs%3A3%3A%22_st%22%3Bi%3A1%3Bs%3A36%3A%22d17524e1-1c50-4259-a75e-5f90fc4f3835%22%3B%7D'
    );
  });
  it('sets cookie according to options.cookieMaxAge', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
          cookieMaxAge: 1000000,
        });
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
        const cookies: string[] = ctx.res.getHeader('Set-Cookie') as string[];
        expect(cookies.length).toBe(2);
        expect(cookies[0]).toMatch(/_at=(.*) Max-Age=1000000/);
        expect(cookies[1]).toMatch(/_rt=(.*) Max-Age=1000000/);
      },
      done,
      '_st=goodtoken'
    );
  });
  it('sets cookie according to options.cookiePath', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
          cookieMaxAge: 1000000,
          cookiePath: '/home',
        });
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
        const cookies: string[] = ctx.res.getHeader('Set-Cookie') as string[];
        expect(cookies.length).toBe(2);
        expect(cookies[0]).toMatch(/_at=(.*); Max-Age=1000000; Path=\/home/);
        expect(cookies[1]).toMatch(/_rt=(.*); Max-Age=1000000; Path=\/home/);
      },
      done,
      '_st=goodtoken'
    );
  });
  it('sets cookie according to options.cookieDomain', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
          cookieMaxAge: 1000000,
          cookieDomain: 'test.com',
        });
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
        const cookies: string[] = ctx.res.getHeader('Set-Cookie') as string[];
        expect(cookies.length).toBe(2);
        expect(cookies[0]).toMatch(
          /_at=(.*); Max-Age=1000000; Domain=test.com; Path=\//
        );
        expect(cookies[1]).toMatch(
          /_rt=(.*); Max-Age=1000000; Domain=test.com; Path=\//
        );
      },
      done,
      '_st=goodtoken'
    );
  });
  it('sets cookie secure flag for env=production', (done) => {
    mockedPost
      .mockResolvedValueOnce({ data: { auth_code: 'testauthcode' } })
      .mockResolvedValueOnce({
        data: { access_token: 'testtoken1', refresh_token: 'testtoken2' },
      })
      .mockRejectedValue(new Error('Should not be called'));
    runOnTestServer(
      async (ctx) => {
        const { status, accessToken } = await migrateTokens(ctx, {
          env: 'production',
          clientId: 'unext',
          clientSecret: 'unext',
          scopes: ['testscope'],
          cookieMaxAge: 1000000,
          cookieDomain: 'test.com',
        });
        expect(status).toBe(MigrateStatus.SUCCESS);
        expect(accessToken).toBe('testtoken1');
        const cookies: string[] = ctx.res.getHeader('Set-Cookie') as string[];
        expect(cookies.length).toBe(2);
        expect(cookies[0]).toMatch(/_at=(.*); Secure/);
        expect(cookies[1]).toMatch(/_rt=(.*); Secure/);
      },
      done,
      '_st=goodtoken'
    );
  });
});
