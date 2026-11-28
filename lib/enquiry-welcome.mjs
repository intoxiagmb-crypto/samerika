export const ENQUIRY_WELCOME_KEY = 'samerika:enquiry-welcome-seen';
export const ENQUIRY_WELCOME_DELAY_MS = 15_000;
let shownWithoutStorage = false;

export function markEnquiryWelcomeSeen(storage) {
  shownWithoutStorage = true;
  try { storage.setItem(ENQUIRY_WELCOME_KEY, '1'); }
  catch { /* Keep the dismissal for this app load when storage is unavailable. */ }
}

export function claimEnquiryWelcome(storage) {
  try {
    if (storage.getItem(ENQUIRY_WELCOME_KEY) === '1') return false;
    storage.setItem(ENQUIRY_WELCOME_KEY, '1');
    shownWithoutStorage = true;
    return true;
  } catch {
    const show = !shownWithoutStorage;
    shownWithoutStorage = true;
    return show;
  }
}
