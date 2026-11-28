// Browser and Android WebView use the same HTTPS endpoint and HttpOnly session cookie.
// Keep the password byte-for-byte: spaces and case may be intentional.
export async function signIn({ email, password }, fetcher = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  const options = { credentials: 'same-origin', cache: 'no-store', signal: controller.signal };
  try {
    const response = await fetcher('/api/auth/login', {
      ...options, method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email ?? '').trim().toLowerCase(), password: String(password ?? ''), portal: 'auto' }),
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The sign-in service is temporarily unavailable. Please try again.'); }
    if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Unable to sign in. Please try again.');
    if (data?.ok !== true) throw new Error('The sign-in service returned an unexpected response. Please try again.');
    // Do not redirect into a loop when a browser/WebView fails to retain the session.
    const session = await fetcher('/api/auth/session', options);
    if (session.status === 401) throw new Error('Your sign-in session could not be saved. Enable cookies, or close and reopen the app, then try again.');
    if (!session.ok || (await session.json()).authenticated !== true) throw new Error('Unable to confirm your sign-in session. Please try again.');
    return '/portal';
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Sign-in timed out. Check your connection and try again.');
    if (error instanceof TypeError) throw new Error('Unable to connect. Check your internet connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}
