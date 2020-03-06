# U-NEXTJS OAuth Migration Helper

This is a package to help migrate user tokens and security tokens to U-NEXT OAuth Access Tokens and Refresh Tokens.

# Installation

Currently we don't have this published to any package manage. You will need to reference the repository directly in your package.json like so:

```json
"dependencies": {
    "unextjs-oauth": "git@github.com:u-next/unextjs-oauth.git",
}
```

# Usage

In your `_app.js` or `_app.tsx` file, you simply need to pass the nextjs context into the helper function provided by this package like so:

```javascript
class CoreApp extends App {
  public static async getInitialProps(initialProps) {
    const appProps = await App.getInitialProps(initialProps);

    // This will migrate the tokens
    await migrateTokens(initialProps.ctx, {
        clientId: 'unextApp',
        clientSecret: 'unextApp',
        });

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

`migrateTokens` second argument is for options to adjust how the migration behaves.

**🚨You must set `env` to production for actual production use or the cookies will not be secure!🚨**

- `env`: **_string_** Defaults to development. Accepts `production` as a string to switch the endpoint to the production U-NEXTJS OAuth2 endpoint
- `url`: **_string_** Override the API endpoint of the OAuth2 server
- `cookieMaxAge`: **_number_** Max age of the cookie in seconds _(Defaults to 60 minutes)_
- `cookiePath`: **_string_** For the cookie _(Defaults to `/`)_
- `cookieDomain`: **_string_** Domain of the cookie
- `scopes`: **_[string]_** Array of scopes (by default only `offline` scope will be included)
- `clientId`: **_string_** OAuth2 client ID (mandatory)
- `clientSecret` **_string_** OAuth2 client secret (mandatory)
