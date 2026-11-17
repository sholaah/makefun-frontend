// format.js — small display helpers shared by every view.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 -> "$1,234.50"; null/NaN -> "—" */
export function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? usd.format(n) : "—";
}

/** Compact money for tight card layouts: 12500 -> "$12.5k". */
export function moneyShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return money(n);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO string -> "17 Nov 2026, 12:30" (local time). */
export function dateTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

/**
 * Human countdown to an ISO deadline: "3d 4h left", "5h 12m left",
 * "42m left", "closed" once the moment has passed.
 */
export function timeLeft(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms)) return "—";
  if (ms <= 0) return "closed";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}

/** CSS class for a deadline: urgent < 6h, soon < 24h. */
export function urgencyClass(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  if (ms < 6 * 3600e3) return "countdown urgent";
  if (ms < 24 * 3600e3) return "countdown soon";
  return "countdown";
}

/** Cut a string at a word boundary and add an ellipsis. */
export function truncate(text, max = 140) {
  const s = String(text ?? "");
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ") || max).trimEnd() + "…";
}

/** Escape a value for safe interpolation into HTML. */
export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
