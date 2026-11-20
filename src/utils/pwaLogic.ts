export function detectIOSUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function isStandaloneDisplayMode(
  matchMediaStandalone: boolean,
  navigatorStandalone?: boolean
): boolean {
  return Boolean(matchMediaStandalone || navigatorStandalone === true);
}
