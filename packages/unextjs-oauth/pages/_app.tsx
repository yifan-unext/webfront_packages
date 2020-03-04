import React from 'react';
import App, { AppContext } from 'next/app';
import migrateTokens from '../src';

class CoreApp extends App {
  public static async getInitialProps(initialProps: AppContext) {
    const appProps = await App.getInitialProps(initialProps);

    await migrateTokens(initialProps.ctx);

    return appProps;
  }

  public render() {
    const { Component, pageProps } = this.props;

    return <Component {...pageProps} />;
  }
}

export default CoreApp;
