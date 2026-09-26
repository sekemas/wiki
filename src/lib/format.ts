/** Date helpers. UTC + explicit locale so the server and the browser agree. */

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return dateFmt.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return `${dateTimeFmt.format(date)} UTC`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "second"],
    [3600, "minute"],
    [86_400, "hour"],
    [604_800, "day"],
    [2_592_000, "week"],
    [31_536_000, "month"],
  ];
  if (seconds < 45) return "just now";
  for (let i = 1; i < units.length; i++) {
    const [limit, name] = units[i];
    if (seconds < limit) {
      const value = Math.round(seconds / units[i - 1][0]);
      return `${String(value)} ${name}${value === 1 ? "" : "s"} ago`;
    }
  }
  const years = Math.max(1, Math.round(seconds / 31_536_000));
  return `${String(years)} year${years === 1 ? "" : "s"} ago`;
}

export function initial(text: string): string {
  const match = /[a-z0-9]/i.exec(text);
  return (match ? match[0] : "#").toUpperCase();
}
