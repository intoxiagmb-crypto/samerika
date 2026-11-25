import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { getDatabase } from '../lib/database.mjs';
import { migrate } from '../lib/migrations.mjs';
import { hashPassword } from '../lib/local-auth.mjs';

if (process.env.VERCEL || process.env.TURSO_DATABASE_URL || process.env.BLOB_READ_WRITE_TOKEN || process.env.NODE_ENV === 'production') {
  throw new Error('Demo setup is local development only. Remote services must be disconnected.');
}
const db = getDatabase();
try {
  await migrate(db.client);
  await mkdir('.solaris', { recursive: true });
  let credentials;
  try { credentials = JSON.parse(await readFile('.solaris/demo-credentials.json', 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    credentials = Object.fromEntries(['company', 'staff', 'agent', 'customer'].map(portal => [portal, { email: `${portal}@solaris.demo`, password: randomBytes(24).toString('base64url') }]));
  }
  credentials.staff ??= { email: 'staff@solaris.demo', password: randomBytes(24).toString('base64url') };
  for (const [portal, role] of [['company', 'ADMIN'], ['staff', 'SALES'], ['agent', 'PARTNER'], ['customer', 'CUSTOMER']]) {
    const id = `local-demo-${portal}`, credential = credentials[portal];
    if (await db.prepare('SELECT id FROM users WHERE id=?').bind(id).first()) continue;
    const { salt, hash } = hashPassword(credential.password);
    await db.batch([
      db.prepare("INSERT INTO users(id,email,name,role,status,profile,created_at) VALUES(?,?,?,?,'Active','{}',?)").bind(id, credential.email, `Demo ${portal}`, role, new Date().toISOString()),
      db.prepare('INSERT INTO local_credentials(user_id,salt,password_hash) VALUES(?,?,?)').bind(id, salt, hash),
    ]);
  }
  await writeFile('.solaris/demo-credentials.json', JSON.stringify(credentials, null, 2), { mode: 0o600 });
  console.log('Local accounts prepared. Credentials are in ignored .solaris/demo-credentials.json. No remote records were changed.');
} finally { db.client.close(); }
