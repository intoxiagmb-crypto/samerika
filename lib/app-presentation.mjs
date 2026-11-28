// Presentation only. This marker never grants access or changes authentication.
// The existing Android shell appends this token to its WebView user agent.
const androidAppPattern = String.raw`(?:^|\s)SamerikaAndroid\/\d+(?:\.\d+)*(?=\s|$)`;

export function isAndroidApp(userAgent = '') {
  return new RegExp(androidAppPattern).test(userAgent);
}

// Run in the document head before content paints. No cookie or stored preference:
// opening the same URL in a regular browser must always use the website layout.
export const appPresentationScript = `if(new RegExp(${JSON.stringify(androidAppPattern)}).test(navigator.userAgent)){document.documentElement.setAttribute('data-samerika-app','android');}`;
