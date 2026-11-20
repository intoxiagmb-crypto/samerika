import { z } from 'zod';
import { hashPassword } from './local-auth.mjs';
import { ROLES, requireRole, assert } from './policy.mjs';

const accountSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  role: z.enum(ROLES),
  password: z.string().min(12, 'Use at least 12 characters.').max(256),
});

export async function createAccount(db, actor, input) {
  requireRole(actor, ['ADMIN']);
  const data = accountSchema.parse(input);
  const id = crypto.randomUUID(), at = new Date().toISOString();
  const { salt, hash } = hashPassword(data.password);
  await db.batch([
    db.prepare("INSERT INTO users(id,email,name,role,status,profile,created_at) VALUES(?,?,?,?,?,'{}',?)").bind(id, data.email, data.name, data.role, data.role === 'PARTNER' ? 'Pending' : 'Active', at),
    db.prepare('INSERT INTO local_credentials(user_id,salt,password_hash) VALUES(?,?,?)').bind(id, salt, hash),
    db.prepare('INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(), actor.id, id, 'user.created', JSON.stringify({ role: data.role }), at),
  ]);
  return id;
}

export async function resetAccountPassword(db, actor, { id, password }) {
  requireRole(actor, ['ADMIN']);
  z.string().min(12).max(256).parse(password);
  assert(await db.prepare('SELECT id FROM users WHERE id=?').bind(id).first(), 'User not found.', 404);
  const { salt, hash } = hashPassword(password);
  await db.batch([
    db.prepare('INSERT INTO local_credentials(user_id,salt,password_hash) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash').bind(id, salt, hash),
    db.prepare('DELETE FROM local_sessions WHERE user_id=?').bind(id),
    db.prepare('INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(), actor.id, id, 'user.password_reset', '{}', new Date().toISOString()),
  ]);
  return id;
}

export async function bootstrapAdministrator(client, input) {
  const data = accountSchema.parse({ ...input, role: 'ADMIN' });
  const tx = await client.transaction('write');
  try {
    assert(!(await tx.execute("SELECT id FROM users WHERE role='ADMIN' LIMIT 1")).rows.length, 'An administrator already exists. Use People & partners to manage accounts.', 409);
    const id = crypto.randomUUID(), { salt, hash } = hashPassword(data.password);
    await tx.execute({ sql: "INSERT INTO users(id,email,name,role,status,profile,created_at) VALUES(?,?,?,'ADMIN','Active','{}',?)", args: [id, data.email, data.name, new Date().toISOString()] });
    await tx.execute({ sql: 'INSERT INTO local_credentials(user_id,salt,password_hash) VALUES(?,?,?)', args: [id, salt, hash] });
    await tx.commit();
    return id;
  } catch (error) { await tx.rollback(); throw error; }
  finally { tx.close(); }
}
