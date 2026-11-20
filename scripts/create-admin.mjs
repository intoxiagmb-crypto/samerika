import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { getDatabase } from '../lib/database.mjs';
import { bootstrapAdministrator } from '../lib/accounts.mjs';

if (!process.stdin.isTTY) throw new Error('Run npm run admin:create in an interactive terminal. Password input is hidden.');
let hidden = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk); callback(); } });
const prompt = createInterface({ input: process.stdin, output, terminal: true });
const db = getDatabase();
try {
  const email = await prompt.question('Administrator email: ');
  const name = await prompt.question('Administrator name: ');
  process.stdout.write('Password (at least 12 characters, hidden): '); hidden = true;
  const password = await prompt.question('');
  process.stdout.write('\nRepeat password (hidden): ');
  const repeated = await prompt.question(''); hidden = false; process.stdout.write('\n');
  if (password !== repeated) throw new Error('Passwords did not match.');
  await bootstrapAdministrator(db.client, { email, name, password });
  console.log('Administrator created. Sign in at /login/company.');
} finally { hidden = false; prompt.close(); db.client.close(); }
