export const ENQUIRY_WELCOME_KEY = 'samerika:enquiry-welcome-seen';

export function claimEnquiryWelcome(storage) {
  if (storage.getItem(ENQUIRY_WELCOME_KEY) === '1') return false;
  storage.setItem(ENQUIRY_WELCOME_KEY, '1');
  return true;
}
