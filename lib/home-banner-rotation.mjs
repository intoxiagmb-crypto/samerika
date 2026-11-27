export const BANNER_INTERVAL_MS = 5000;

export function startBannerRotation(advance) {
  const timer = setInterval(advance, BANNER_INTERVAL_MS);
  return () => clearInterval(timer);
}
