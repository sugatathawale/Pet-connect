/** Age and date helpers. Ages are always derived from a date of birth. */

export function ageInMonths(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  return Math.max(0, now.getDate() < dob.getDate() ? months - 1 : months);
}

export function ageInYears(dateOfBirth: string): number {
  return ageInMonths(dateOfBirth) / 12;
}

/** Human age label, e.g. "7 months" or "2 years". */
export function formatAge(dateOfBirth: string): string {
  const months = ageInMonths(dateOfBirth);
  if (months < 1) return 'Newborn';
  if (months < 24) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** Compact date range, e.g. "10–15 Sept". */
export function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Not set';
  const from = new Date(start);
  const to = new Date(end);
  const month = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

  if (from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${to.getDate()} ${month(to)}`;
  }
  return `${from.getDate()} ${month(from)} – ${to.getDate()} ${month(to)}`;
}

/** Relative timestamp for chat and notification lists. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.floor((Date.now() - then) / 60000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True when today falls inside the window (inclusive). */
export function isWithinWindow(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const today = toISODate(new Date());
  return today >= start && today <= end;
}
