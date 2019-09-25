import { NextPageContext } from 'next';
interface MigrateOptions {
    url?: string;
    env?: 'production';
    cookieMaxAge?: number;
    cookiePath?: string;
    cookieDomain?: string;
}
export declare const migrateTokens: (ctx: NextPageContext, options?: MigrateOptions) => Promise<void>;
export default migrateTokens;
