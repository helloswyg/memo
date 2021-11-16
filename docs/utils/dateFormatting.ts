
export function getFriendlyTimeLabel(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const seconds = Math.round(elapsed / 1000);

  if (seconds === 0) return 'now';
  if (seconds === 1) return '1 second ago';

  return `${ seconds } seconds ago`;
}
