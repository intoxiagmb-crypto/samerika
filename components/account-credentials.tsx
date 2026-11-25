'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, X } from 'lucide-react';
import { accountCredentialText, accountLoginPath, generateAccountPassword } from '@/lib/account-access.mjs';

export type AccountCredentials = { name: string; email: string; role: string; password: string };

export function AccountPasswordField({ label, disabled }: { label: string; disabled: boolean }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  return <div className="form-field wide account-password-field">
    <label htmlFor="account-password">{label} *</label>
    <input id="account-password" name="password" type={visible ? 'text' : 'password'} value={password}
      onChange={event => { setPassword(event.target.value); setMessage(''); }} required minLength={12} maxLength={256}
      autoComplete="new-password" disabled={disabled} spellCheck={false} />
    <div className="credential-actions">
      <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { setPassword(generateAccountPassword()); setMessage('Strong password generated. Save the account to activate it.'); }}><RefreshCw size={15} /> Generate password</button>
      <button type="button" className="button button-secondary" disabled={disabled || !password} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}{visible ? 'Hide' : 'Show'}</button>
    </div>
    <small role="status">{message || 'Enter at least 12 characters, or generate a random password.'}</small>
  </div>;
}

export function AccountCredentialsDialog({ account, onClose }: { account: AccountCredentials; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const close = useRef<HTMLButtonElement>(null);
  const loginUrl = `${window.location.origin}${accountLoginPath(account.role)}`;
  useEffect(() => { close.current?.focus(); }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(accountCredentialText(account, window.location.origin));
      setMessage('Credentials copied. Share privately with this account holder.');
    } catch { setMessage('Clipboard unavailable. Use Show password and copy the details manually.'); }
  }
  return <div className="modal-backdrop"><section className="modal form-modal credential-receipt" role="dialog" aria-modal="true" aria-labelledby="credentials-title">
    <button ref={close} className="modal-close icon-button" aria-label="Close credentials" onClick={onClose}><X size={20} /></button>
    <span className="eyebrow">ACCOUNT SAVED</span><h2 id="credentials-title">Share account access</h2>
    <p>Copy these credentials before closing. The password cannot be viewed again after this dialog closes.</p>
    <dl><dt>Name</dt><dd>{account.name}</dd><dt>Sign-in link</dt><dd><a href={loginUrl} target="_blank" rel="noopener noreferrer">{loginUrl}</a></dd><dt>Email</dt><dd>{account.email}</dd><dt>Password</dt><dd><code>{visible ? account.password : '••••••••••••••••'}</code></dd></dl>
    {account.role === 'PARTNER' && <p>The agent must complete KYC and receive company approval before submitting leads.</p>}
    <div className="credential-actions"><button className="button button-secondary" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}{visible ? 'Hide password' : 'Show password'}</button><button className="button button-glow" onClick={copy}><Copy size={15} /> Copy login details</button><button className="button button-secondary" onClick={onClose}>Done</button></div>
    <p role="status">{message || 'Share privately. Do not post passwords in a public group.'}</p>
  </section></div>;
}
