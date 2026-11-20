import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep the existing business service's prepared-statement and atomic batch contract.
export function adaptDatabase(client) {
  const result = r => ({ results: r.rows.map(row => ({ ...row })), meta: { changes: r.rowsAffected } });
  const prepare = (sql, args = []) => ({
    sql, args,
    bind(...values) { return prepare(sql, values); },
    async first() { const r = await client.execute({ sql, args }); return r.rows[0] ? { ...r.rows[0] } : null; },
    async all() { return result(await client.execute({ sql, args })); },
    async run() { return result(await client.execute({ sql, args })); },
  });
  return {
    client,
    prepare,
    async batch(statements) {
      return (await client.batch(statements.map(({ sql, args }) => ({ sql, args })), 'write')).map(result);
    },
  };
}

export function localDataAllowed(environment = process.env) {
  return !environment.VERCEL && (environment.NODE_ENV !== 'production' || environment.SOLARIS_LOCAL_DATA === '1');
}

export function databaseConfig(environment = process.env) {
  const url = environment.TURSO_DATABASE_URL;
  if (url) {
    if (!/^(libsql|https):\/\//.test(url)) throw new Error('TURSO_DATABASE_URL must be a remote libsql:// or https:// URL.');
    if (!environment.TURSO_AUTH_TOKEN) throw new Error('Set TURSO_AUTH_TOKEN for the remote database.');
    return { url, authToken: environment.TURSO_AUTH_TOKEN };
  }
  if (!localDataAllowed(environment)) throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Production never uses an ephemeral local database.');
  return { url: `file:${resolve('.solaris/local.db')}` };
}

let database;
export function getDatabase() {
  if (!database) {
    const config = databaseConfig();
    if (config.url.startsWith('file:')) mkdirSync(resolve('.solaris'), { recursive: true });
    database = adaptDatabase(createClient(config));
  }
  return database;
}
