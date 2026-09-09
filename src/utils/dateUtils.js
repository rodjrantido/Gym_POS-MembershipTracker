/**
 * Timezone-safe Date Utilities
 * Prevents UTC off-by-one errors (where dates shift 1 day behind in non-UTC timezones)
 */

/**
 * Returns a 'YYYY-MM-DD' string in the user's LOCAL timezone.
 * Never converts to UTC (which is what .toISOString() does).
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a Date object at LOCAL midnight (00:00:00).
 * Standard new Date('YYYY-MM-DD') treats the string as UTC midnight,
 * which causes it to be shifted 1 day behind when viewed in local time.
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === 'string') {
    // If it contains 'T', extract the YYYY-MM-DD portion or parse directly
    const datePart = dateInput.split('T')[0];
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }

  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a 'YYYY-MM-DD' string into a friendly local display string
 * without suffering from 1-day UTC shift.
 */
export function formatDateDisplay(dateInput) {
  if (!dateInput) return 'N/A';
  const localDate = parseLocalDate(dateInput);
  return localDate.toLocaleDateString();
}

/**
 * Adds a specified number of days to a base date (string or Date)
 * and returns the new date as a 'YYYY-MM-DD' string in local time.
 */
export function addDaysToDate(baseDateInput, days = 30) {
  const base = parseLocalDate(baseDateInput);
  base.setDate(base.getDate() + Number(days));
  return getLocalDateString(base);
}

/**
 * Calculates days between two date inputs in local calendar days.
 */
export function calculateDaysBetween(startDateInput, endDateInput) {
  if (!startDateInput || !endDateInput) return 0;
  const start = parseLocalDate(startDateInput);
  start.setHours(0, 0, 0, 0);
  const end = parseLocalDate(endDateInput);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Accurately calculates days remaining until an expiration date.
 * Both dates are normalized to local midnight to avoid fractional day / timezone errors.
 */
export function calculateDaysRemaining(expiryDateInput) {
  if (!expiryDateInput) return 0;
  const expiry = parseLocalDate(expiryDateInput);
  expiry.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Parses pause metadata if status is encoded as 'PAUSED:YYYY-MM-DD:remainingDays'
 */
export function getMemberPauseInfo(member) {
  const statusStr = member?.status || '';
  if (!statusStr.startsWith('PAUSED')) return null;

  const parts = statusStr.split(':');
  const pausedDate = parts[1] || null;
  const savedRemainingDays = parts[2] ? parseInt(parts[2], 10) : null;

  return {
    isPaused: true,
    pausedDate,
    savedRemainingDays,
  };
}

/**
 * Returns member status: 'PAUSED', 'EXPIRED', 'EXPIRING SOON' (<= 5 days), or 'ACTIVE'.
 */
export function getMemberStatus(member) {
  if (member?.status?.startsWith('PAUSED')) {
    return 'PAUSED';
  }
  const expiry = member?.expiresAt || member?.expires_at;
  if (!expiry) return member?.status || 'ACTIVE';

  const days = calculateDaysRemaining(expiry);
  if (days <= 0) return 'EXPIRED';
  if (days <= 5) return 'EXPIRING SOON';
  return 'ACTIVE';
}
