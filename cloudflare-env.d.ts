declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare const __SOLARIS_LOCAL_AUTH__: boolean;
