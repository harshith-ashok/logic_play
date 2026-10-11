const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Formats an ISO date string (e.g. "2026-03-14") as "Mar 14, 2026". */
export function formatDate(date: string): string {
  return formatter.format(new Date(date));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Formats an ISO timestamp as "Mar 14, 3:42 PM". */
export function formatDateTime(date: string): string {
  return dateTimeFormatter.format(new Date(date));
}
