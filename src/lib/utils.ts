// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const today = (): string => new Date().toISOString().slice(0, 10);

export const fmt = (d?: string): string => (d ? d.replace(/-/g, "/") : "—");

export const yen = (n: string | number | null | undefined): string =>
  n !== "" && n !== undefined && n !== null
    ? `¥${Number(n).toLocaleString()}`
    : "—";

export const nowStr = (): string =>
  new Date().toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
