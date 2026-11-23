// "1.2s", "45s", "2m 3s", "1h 5m". Used for how long a run took.
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return "0s";
  if (milliseconds < 1000) return `${milliseconds}ms`;

  const seconds = milliseconds / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const restSeconds = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${restSeconds}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};
