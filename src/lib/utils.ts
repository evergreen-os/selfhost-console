import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString();
}

export function formatRelativeTime(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const now = Date.now();
  const diff = date.getTime() - now;
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minutes');
  }

  const hours = Math.round(diff / 3600000);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hours');
  }

  const days = Math.round(diff / 86400000);
  return formatter.format(days, 'days');
}
