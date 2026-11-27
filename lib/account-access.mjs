import { accountName } from './brand-name.mjs';
// 64 symbols: each random byte supplies six unbiased bits.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_';

export function generateAccountPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, byte => PASSWORD_ALPHABET[byte & 63]).join('');
}

export function accountLoginPath(role) {
  if (role === 'ADMIN') return '/login/company';
  if (role === 'PARTNER') return '/login/partner';
  if (role === 'CUSTOMER') return '/login/customer';
  return '/login/staff';
}

export function accountCredentialText(account, origin) {
  return `Samerika Power — Account access\nName: ${accountName(account.name,account.role)}\nLogin: ${origin}${accountLoginPath(account.role)}\nEmail: ${account.email}\nPassword: ${account.password}\n\nKeep these credentials private. Contact your company administrator if you need a password reset.`;
}
