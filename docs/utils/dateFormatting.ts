
export function getFriendlyTimeLabel(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const seconds = Math.round(elapsed / 1000);

  if (seconds === 0) return 'now';

  return `${ seconds }s ago`;
}
