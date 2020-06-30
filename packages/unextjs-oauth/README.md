# U-NEXTJS OAuth Migration Helper

This is a package to help migrate user tokens and security tokens to U-NEXT OAuth Access Tokens and Refresh Tokens.

# Installation

You need a deploy token for downloading private NPM packages from the `u-next` Github organization and _Read_ authorization for the `u-next/unextjs-oauth` repository.

1. Log-in with npm to https://npm.pkg.github.com providing your ID and the deploy token as credentials
2. NPM install the package as follows

```
npm install @u-next/unextjs-oauth
```

# Change history

- `0.4.0` introduces breaking changes in the MigrateOptions
  - `cookieMaxAge` has been replaced by `cookieTTLs`, in order to specify separate cookie life times for OAuth2 access token and refresh token.
  - `scope` becomes mandatory
  - `cookieDomain` becomes mandatory

# Usage

In your `_app.js` or `_app.tsx` file, you simply need to pass the nextjs context into the helper function provided by this package like so:

```javascript
class CoreApp extends App {
  public static async getInitialProps(initialProps) {
    const appProps = await App.getInitialProps(initialProps);

    // This will migrate the tokens
    const { status } = await migrateTokens(initialProps.ctx, {
        clientId: 'unextApp',
        clientSecret: 'unextApp',
        scope: ['googleHome'],
        cookieTTLs: { accessTokenMaxAge: 6*3600, refreshTokenMaxAge: 365 * 24 * 3600 },
        cookieDomain: 'unext.jp',
        });
    if (status === 'success') {
      // migration succeeded
    }
    if (status === 'failed') {
      // migration error
    }
    if (status === 'none') {
      // nothing done (already migrated or no cookie exists)
    }
    return appProps;
  }

  public render() {
    const { Component, pageProps } = this.props;

    return <Component {...pageProps} />;
  }
}

export default CoreApp;
```

The migration will only happen if the user does not already have an access token set _and_ has a security token set. If either of those conditions are not met, it will skip the migration.

## Migration Options

`migrateTokens` second argument is for options to specify how the migration behaves.

**🚨You must set `env` to _'production'_ for actual production use or the cookies will not be secure!🚨**

- `env`: **_string_** Defaults to development. Accepts `production` as a string to switch the endpoint to the production U-NEXTJS OAuth2 endpoint
- `url`: **_string_** Optional OAuth2 endpoint override
- `clientId`: **_string_** OAuth2 client ID (mandatory)
- `clientSecret` **_string_** OAuth2 client secret (mandatory)
- `scopes`: **_string[]_** OAuth2 scopes; _'offline'_ is included automatically
- `cookieTTLs`: **_CookieMaxAges_** | **_CookieExpires_** Cookie TTLs
- `cookiePath`: **_string_** Cookie Path, defaults to `/`
- `cookieDomain`: **_string_**

### _CookieMaxAges_

- `accessTokenMaxAge`: **_number_** OAuth2 access token cookie MaxAge [sec]
- `refreshTokenMaxAge`: **_number_** OAuth2 refresh token cookie MaxAge [sec])

### _CookieExpires_

- `accessTokenExpires`: **_Date_** OAuth2 access token cookie date of expiration
- `refreshTokenExpires`: **_Date_** OAuth2 refresh token cookie date of expiration

## Migration Result

- `status`: **_MigrationStatus_** Result of migration
- `accessToken`: **_string_** OAuth2 access token (useful for chaining with API calls like user info fetch)

### _MigrationStatus_

- `MigrationStatus.NONE`: no migration (already migrated or nothing to migrate)
- `MigrationStatus.FAILED`: migration attempt failed
- `MigrationStatus.SUCCESS`: migration successful
