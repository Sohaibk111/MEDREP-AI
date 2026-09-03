/**
 * Centralized Operational Date & Time Utilities for MedRep AI
 * 
 * Supports deterministic testing and demo simulation via MEDREP_TODAY environment variable,
 * while defaulting to the real current date in standard production operation.
 */

/**
 * Validates whether a given string is a valid ISO date format (YYYY-MM-DD)
 * and represents a calendar-valid date.
 */
export function isValidISODate(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [year, month, day] = trimmed.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Returns the current operational date in YYYY-MM-DD ISO format.
 * - If MEDREP_TODAY environment variable is set and valid, it is returned.
 * - If MEDREP_TODAY is invalid, logs a warning and falls back to real current date.
 * - Otherwise, returns the real current UTC date.
 */
export function getOperationalDateISO(): string {
  if (typeof process !== 'undefined' && process.env?.MEDREP_TODAY) {
    const configured = process.env.MEDREP_TODAY.trim();
    if (isValidISODate(configured)) {
      return configured;
    }
    console.warn(`[dateUtils] Invalid MEDREP_TODAY date "${configured}". Falling back to system current date.`);
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable display string
 * e.g., "Tuesday, Sep 1, 2026"
 */
export function formatOperationalDate(iso: string): string {
  if (!isValidISODate(iso)) {
    return iso;
  }
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
