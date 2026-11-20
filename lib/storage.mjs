import { put, get, del } from '@vercel/blob';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { localDataAllowed } from './database.mjs';

export function validateFileKey(key) {
  if (typeof key !== 'string' || !/^documents\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}$/.test(key)) throw new Error('Invalid document key.');
  return key;
}

export function createStorage({ token = process.env.BLOB_READ_WRITE_TOKEN, local = localDataAllowed(), root = resolve('.solaris/files') } = {}) {
  const path = key => resolve(root, validateFileKey(key));
  const requireStorage = () => { if (!token && !local) throw new Error('Connect a private Vercel Blob store and set BLOB_READ_WRITE_TOKEN.'); };
  return {
    async put(key, bytes, mime) {
      validateFileKey(key); requireStorage();
      if (token) { await put(key, bytes, { access: 'private', token, contentType: mime, addRandomSuffix: false, allowOverwrite: false }); return; }
      await mkdir(dirname(path(key)), { recursive: true });
      await writeFile(path(key), bytes, { flag: 'wx', mode: 0o600 });
    },
    async get(key) {
      validateFileKey(key); requireStorage();
      if (token) { const result = await get(key, { access: 'private', token, useCache: false }); return result?.statusCode === 200 ? result.stream : null; }
      try { return new Uint8Array(await readFile(path(key))); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async delete(key) {
      validateFileKey(key); requireStorage();
      if (token) { await del(key, { token }); return; }
      try { await unlink(path(key)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
  };
}
