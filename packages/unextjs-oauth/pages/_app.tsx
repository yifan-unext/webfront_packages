import React from 'react';
import App, { AppContext } from 'next/app';
import migrateTokens, { MigrateStatus } from '../src';

class CoreApp extends App {
  public static async getInitialProps(initialProps: AppContext) {
    const appProps = await App.getInitialProps(initialProps);

    const { status } = await migrateTokens(initialProps.ctx, {
      clientId: 'unextApp',
      clientSecret: 'unextApp',
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
