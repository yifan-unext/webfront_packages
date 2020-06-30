import React from 'react';
import App, { AppContext } from 'next/app';
import migrateTokens, { MigrateStatus } from '../src';

class CoreApp extends App {
  public static async getInitialProps(initialProps: AppContext) {
    const appProps = await App.getInitialProps(initialProps);

    const { status } = await migrateTokens(initialProps.ctx, {
      clientId: 'unextApp',
      clientSecret: 'unextApp',
      scopes: ['googleHome'],
      cookieDomain: 'unext.jp',
      cookieTTLs: {
        accessTokenMaxAge: 6 * 3600,
        refreshTokenMaxAge: 365 * 24 * 3600,
      },
    });
    if (status === MigrateStatus.FAILED) {
      console.log('Failed to migrate');
    }

    return appProps;
  }

  public render() {
    const { Component, pageProps } = this.props;

    return <Component {...pageProps} />;
  }
}

export default CoreApp;
