import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { adaptDatabase, databaseConfig, localDataAllowed } from '../lib/database.mjs';
import { migrate } from '../lib/migrations.mjs';
import { createAccount, bootstrapAdministrator, resetAccountPassword } from '../lib/accounts.mjs';
import { login, sessionUser } from '../lib/local-auth.mjs';
import { createStorage, validateFileKey } from '../lib/storage.mjs';
import { Business } from '../lib/business.mjs';

test('Vercel never falls back to filesystem storage, even with the local override', () => {
  for (const NODE_ENV of ['production','development','test']) {
    const environment = { VERCEL:'1', NODE_ENV, SOLARIS_LOCAL_DATA:'1' };
    assert.equal(localDataAllowed(environment), false);
    assert.throws(() => databaseConfig(environment), /TURSO_DATABASE_URL/);
  }
  assert.throws(() => databaseConfig({ NODE_ENV:'production' }), /ephemeral/);
  assert.throws(() => databaseConfig({ TURSO_DATABASE_URL:'file:/tmp/unsafe.db' }), /remote/);
  assert.equal(databaseConfig({ NODE_ENV:'development' }).url.startsWith('file:'), true);
});

test('migrations are repeatable and failed batches roll back all their writes', async () => {
  const client = createClient({ url:':memory:' });
  try {
    await migrate(client); await migrate(client);
    const db = adaptDatabase(client);
    const expected = (await readdir(new URL('../drizzle/', import.meta.url))).filter(name => name.endsWith('.sql')).sort();
    const applied = await db.prepare('SELECT name FROM solaris_migrations ORDER BY name').all();
    assert.deepEqual(applied.results.map(row => row.name), expected);
    await assert.rejects(db.batch([
      db.prepare('INSERT INTO settings VALUES(?,?)').bind('atomic','{}'),
      db.prepare('INSERT INTO settings VALUES(?,?)').bind('atomic','{}'),
    ]), /UNIQUE/);
    assert.equal(await db.prepare('SELECT * FROM settings WHERE key=?').bind('atomic').first(), null);
  } finally { client.close(); }
});

test('production accounts require an admin, pending partners can submit KYC, password resets revoke sessions', async () => {
  const client = createClient({ url:':memory:' });
  try {
    await migrate(client);
    const db = adaptDatabase(client), service = new Business(db);
    const id = await bootstrapAdministrator(client, { name:'Owner', email:'owner@example.test', password:'Owner-long-password!' });
    await assert.rejects(bootstrapAdministrator(client, { name:'Other',email:'other@example.test',password:'Other-long-password!' }), /already exists/);
    const admin = await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
    const input = { name:'Partner', email:'PARTNER@example.test', password:'Partner-long-password!', role:'PARTNER' };
    await assert.rejects(createAccount(db, { ...admin, role:'CUSTOMER' }, input), /permission/);
    const partnerId = await createAccount(db, admin, input);
    const {token} = await login(db, { ...input, portal:'agent' });
    const partner = await sessionUser(db,token);
    assert.equal(partner.status,'Pending');
    await assert.rejects(service.act(partner,'lead.create',{}), /permission/);
    const kyc = await service.upload(partner,{projectId:'',documentType:'Partner KYC',name:'kyc.pdf',mime:'application/pdf',size:100,key:'test'});
    assert.ok(kyc);
    await resetAccountPassword(db,admin,{id:partnerId,password:'New-partner-password!'});
    assert.equal(await sessionUser(db,token),null);
    await assert.rejects(login(db,{...input,portal:'agent'}), /incorrect/);
    assert.ok((await login(db,{...input,password:'New-partner-password!',portal:'agent'})).token);
    const customerId=await createAccount(db,admin,{name:'Customer',email:'customer@example.test',password:'Customer-long-password!',role:'CUSTOMER'});
    const customer=await login(db,{email:'customer@example.test',password:'Customer-long-password!',portal:'customer'});
    assert.equal((await sessionUser(db,customer.token)).id,customerId);
    const audit=await db.prepare('SELECT detail FROM audit').all();
    assert.equal(JSON.stringify(audit).includes('password!'),false);
  } finally { client.close(); }
});

test('private file adapter preserves bytes, refuses path traversal and missing production credentials', async () => {
  const root = await mkdtemp(join(tmpdir(),'solaris-storage-'));
  try {
    const storage=createStorage({token:'',local:true,root});
    const key=`documents/kyc/${crypto.randomUUID()}`, bytes=new Uint8Array([37,80,68,70,45]);
    await storage.put(key,bytes,'application/pdf');
    assert.deepEqual(await storage.get(key),bytes);
    await assert.rejects(storage.put(key,bytes,'application/pdf'), /EEXIST/);
    assert.throws(()=>validateFileKey('../../secrets'),/Invalid/);
    await storage.delete(key); assert.equal(await storage.get(key),null);
    await assert.rejects(createStorage({token:'',local:false}).put(key,bytes,'application/pdf'), /private Vercel Blob/);
  } finally { await rm(root,{recursive:true,force:true}); }
});


test('CSRF checks use the external Host while refusing forged forwarded hosts and missing origins', async () => {
  const {isSameOrigin}=await import('../lib/request-origin.mjs');
  const request=headers=>new Request('http://localhost:5186/api/auth/login',{headers});
  assert.equal(isSameOrigin(request({Host:'127.0.0.1:5186',Origin:'http://127.0.0.1:5186'})),true);
  assert.equal(isSameOrigin(request({Host:'solaris.example',Origin:'https://solaris.example','x-forwarded-proto':'https'})),true);
  assert.equal(isSameOrigin(request({Host:'solaris.example',Origin:'https://attacker.example','x-forwarded-host':'attacker.example','x-forwarded-proto':'https'})),false);
  assert.equal(isSameOrigin(request({Host:'solaris.example'})),false);
  assert.equal(isSameOrigin(request({Host:'solaris.example',Origin:'null'})),false);
});
