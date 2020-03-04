'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
var axios_1 = require('axios');
var nookies_1 = require('nookies');
var PRODUCTION_URL = 'https://oauth.unext.jp';
var PRODUCTION_TEST_URL = 'https://oauth-test.unext.jp';
var transformRequest = function(jsonData) {
  if (jsonData === void 0) {
    jsonData = {};
  }
  return Object.entries(jsonData)
    .map(function(x) {
      return encodeURIComponent(x[0]) + '=' + encodeURIComponent(x[1]);
    })
    .join('&');
};
var getOAuthURL = function(options) {
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
exports.migrateTokens = function(ctx, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(void 0, void 0, void 0, function() {
    var isProd,
      cookies,
      securityToken,
      accessToken,
      parsedSt,
      response,
      data,
      headers,
      exchange,
      e_1;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          axios_1.default.defaults.baseURL = getOAuthURL(options);
          isProd = options.env === 'production';
          _a.label = 1;
        case 1:
          _a.trys.push([1, 5, , 6]);
          cookies = nookies_1.parseCookies(ctx);
          if (!cookies) {
            return [2 /*return*/];
          }
          securityToken = cookies['_st'];
          accessToken = cookies['_at'];
          if (!(securityToken && !accessToken)) return [3 /*break*/, 4];
          parsedSt = cookies['_st'].match(
            /([a-z0-9]+)a:2(.*)s:[0-9]{2}:"([a-z0-9-]+)";}/
          );
          if (parsedSt && parsedSt[3]) {
            securityToken = parsedSt[3];
          }
          return [
            4 /*yield*/,
            axios_1.default.post('/oauth2/migration', {
              client_id: 'unextApp',
              scope: ['offline'],
              portal_user_info: {
                securityToken: securityToken,
              },
            }),
          ];
        case 2:
          response = _a.sent();
          if (!(response.data && response.data.auth_code))
            return [3 /*break*/, 4];
          data = {
            grant_type: 'authorization_code',
            code: response.data.auth_code,
            redirect_uri: response.data.redirect_uri,
            client_id: 'unextApp',
            client_secret: 'unextApp',
          };
          headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
          };
          return [
            4 /*yield*/,
            axios_1.default.post('/oauth2/token', transformRequest(data), {
              headers: headers,
            }),
          ];
        case 3:
          exchange = _a.sent();
          if (exchange.data && exchange.data.access_token) {
            nookies_1.setCookie(ctx, '_at', exchange.data.access_token, {
              maxAge: options.cookieMaxAge || 60 * 60,
              secure: isProd,
              httpOnly: true,
              path: options.cookiePath || '/',
              domain: options.cookieDomain,
            });
            nookies_1.setCookie(ctx, '_rt', exchange.data.refresh_token, {
              maxAge: options.cookieMaxAge || 60 * 60,
              secure: isProd,
              httpOnly: true,
              path: options.cookiePath || '/',
              domain: options.cookieDomain,
            });
          }
          _a.label = 4;
        case 4:
          return [3 /*break*/, 6];
        case 5:
          e_1 = _a.sent();
          console.log('Token exchange failed', e_1.message);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.default = exports.migrateTokens;
//# sourceMappingURL=index.js.map
