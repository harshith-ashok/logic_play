const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Formats an ISO date string (e.g. "2026-03-14") as "Mar 14, 2026". */
export function formatDate(date: string): string {
  return formatter.format(new Date(date));
}
