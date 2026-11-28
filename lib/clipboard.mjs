// Android WebView versions differ in Async Clipboard support. Both paths run only
// after the user presses Copy; this does not read the clipboard or store passwords.
export async function copyText(text, browser = globalThis) {
  try {
    if (browser.navigator?.clipboard?.writeText) {
      await browser.navigator.clipboard.writeText(text);
      return;
    }
  } catch { /* Try the user-initiated legacy copy operation. */ }
  const document = browser.document;
  const focused = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;';
  document.body.appendChild(field);
  try {
    field.select();
    field.setSelectionRange(0, field.value.length);
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable.');
  } finally {
    field.value = '';
    field.remove();
    focused?.focus({ preventScroll: true });
  }
}
