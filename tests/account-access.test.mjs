import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { adaptDatabase } from '../lib/database.mjs';
import { migrate } from '../lib/migrations.mjs';
import { bootstrapAdministrator, createAccount, resetAccountPassword } from '../lib/accounts.mjs';
import { login, sessionUser } from '../lib/local-auth.mjs';
import { accountCredentialText, accountLoginPath, generateAccountPassword } from '../lib/account-access.mjs';

test('generated credentials support every employee role and cannot grant staff account-management access', async () => {
  const client = createClient({ url: ':memory:' });
  try {
    await migrate(client);
    const db = adaptDatabase(client);
    const id = await bootstrapAdministrator(client, { name: 'Owner', email: 'owner@example.test', password: generateAccountPassword() });
    const admin = await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
    const passwords = new Set();
    for (const role of ['SALES', 'MANAGER', 'TECHNICAL', 'VERIFIER', 'FINANCE']) {
      const account = { name: role, role, email: `${role.toLowerCase()}@example.test`, password: generateAccountPassword() };
      assert.match(account.password, /^[A-Za-z2-9!@#$%*_-]{24}$/);
      assert.equal(passwords.has(account.password), false);
      passwords.add(account.password);
      const userId = await createAccount(db, admin, account);
      const { token } = await login(db, { ...account, portal: 'staff' });
      const employee = await sessionUser(db, token);
      assert.equal(employee.id, userId);
      await assert.rejects(createAccount(db, employee, { ...account, email: 'unauthorized@example.test', role: 'ADMIN' }), /permission/);
      await assert.rejects(resetAccountPassword(db, employee, { id, password: generateAccountPassword() }), /permission/);
      const replacement = generateAccountPassword();
      await resetAccountPassword(db, admin, { id: userId, password: replacement });
      assert.equal(await sessionUser(db, token), null);
      await assert.rejects(login(db, { ...account, portal: 'staff' }), /incorrect/);
      assert.ok((await login(db, { ...account, password: replacement, portal: 'staff' })).token);
      assert.equal(accountLoginPath(role), '/login/staff');
      assert.ok(accountCredentialText(account, 'https://example.test').includes('https://example.test/login/staff'));
    }
    const stored = JSON.stringify((await client.execute('SELECT * FROM local_credentials')).rows);
    const audit = JSON.stringify((await client.execute('SELECT * FROM audit')).rows);
    for (const password of passwords) {
      assert.equal(stored.includes(password), false);
      assert.equal(audit.includes(password), false);
    }
    assert.equal(accountLoginPath('ADMIN'), '/login/company');
    assert.equal(accountLoginPath('PARTNER'), '/login/partner');
    assert.equal(accountLoginPath('CUSTOMER'), '/login/customer');
  } finally { client.close(); }
});
