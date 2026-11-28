'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { House, UsersRound, Handshake, Mail, LockKeyhole, Eye, EyeOff, LogIn, LoaderCircle, Leaf, Zap, Earth, ArrowLeft } from 'lucide-react';
import { signIn } from '@/lib/sign-in.mjs';
import { portalDestination } from '@/lib/portal-destination';
import { useAndroidApp } from '@/hooks/use-android-app';

type Portal = 'company' | 'staff' | 'agent' | 'customer';
const rememberedEmailKey = 'samerika-app-login-email';
const portals = [
  { id: 'company', label: 'Owner', href: '/login/company', icon: House },
  { id: 'staff', label: 'Staff', href: '/login/staff', icon: UsersRound },
  { id: 'agent', label: 'Partner', href: '/login/partner', icon: Handshake },
] as const;

export default function ApkEcoLogin({ portal = 'company' }: { portal?: Portal }) {
  const androidApp = useAndroidApp();
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (!androidApp) return;
    try {
      const saved = localStorage.getItem(rememberedEmailKey);
      if (saved && saved.length <= 254) { setEmail(saved); setRemember(true); }
    } catch { /* Storage may be unavailable; sign-in still works. */ }
  }, [androidApp]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      await signIn({ email: data.get('email'), password: data.get('password') });
      try {
        if (remember) localStorage.setItem(rememberedEmailKey, String(data.get('email') || '').trim());
        else localStorage.removeItem(rememberedEmailKey);
      } catch { /* Remembering an email is optional. Never store the password. */ }
      window.location.replace(portalDestination(new URLSearchParams(window.location.search).get('next')));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.');
      setBusy(false);
    }
  }

  return <main className="apk-eco-login">
    <div className="eco-login-art">
      <Image src="/images/samerika-eco-login-reference.png" alt="Samerika Power — Powering a Greener Tomorrow, with a solar-powered home" fill sizes="(max-width: 540px) 100vw, 540px"/>
      <Link href="/" className="eco-login-back" aria-label="Back to home"><ArrowLeft size={20}/></Link>
    </div>
    <section className="eco-login-card" aria-labelledby="eco-login-title">
      <header><h1 id="eco-login-title">Welcome Back!</h1><p>Login to access your dashboard</p><span aria-hidden="true"/></header>
      {portal === 'customer' ? <p className="eco-customer-label">Customer login</p> : <nav className="eco-login-portals" aria-label="Choose your login">{portals.map(({ id, label, href, icon: Icon }) => <Link key={id} href={href} aria-current={portal === id ? 'page' : undefined} onClick={event => {
        event.preventDefault();
        if (busy) return;
        const next = portalDestination(new URLSearchParams(window.location.search).get('next'));
        window.location.assign(next === '/portal' ? href : `${href}?next=${encodeURIComponent(next)}`);
      }}><Icon size={23}/><span>{label}</span></Link>)}</nav>}
      <form onSubmit={submit} aria-busy={busy}>
        <label className="eco-login-field"><span className="eco-login-sr">Email address</span><Mail size={22} aria-hidden="true"/><input name="email" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Email address" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} disabled={busy}/></label>
        <div className="eco-login-field"><label htmlFor="eco-login-password" className="eco-login-sr">Password</label><LockKeyhole size={22} aria-hidden="true"/><input id="eco-login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Password" required maxLength={256} disabled={busy}/><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={22}/> : <Eye size={22}/>}</button></div>
        <div className="eco-login-options"><label><input type="checkbox" checked={remember} onChange={event => {
          setRemember(event.target.checked);
          if (!event.target.checked) { try { localStorage.removeItem(rememberedEmailKey); } catch {} }
        }}/><span>Remember email</span></label><button type="button" aria-expanded={help} aria-controls="eco-password-help" onClick={() => setHelp(!help)}>Forgot password?</button></div>
        {help && <div className="eco-login-help" id="eco-password-help" role="status">Contact your company administrator to reset your password, then use the latest credentials they provide. <Link href="/enquiry?interest=callback" scroll={false}>Request a callback</Link></div>}
        {error && <p className="eco-login-error" role="alert">{error}</p>}
        <button className="eco-login-submit" disabled={busy} type="submit">{busy ? <LoaderCircle size={23} className="spin"/> : <LogIn size={23}/>} {busy ? 'Signing in…' : 'Login'}</button>
      </form>
      <p className="eco-login-contact"><span>Don’t have an account?</span> <Link href="/enquiry?interest=callback" scroll={false}>Contact us</Link></p>
    </section>
    <footer className="eco-login-footer"><div><Leaf size={27}/><span>Clean energy</span></div><div><Zap size={27}/><span>Lower electricity bills</span></div><div><Earth size={27}/><span>Green future</span></div></footer>
  </main>;
}
