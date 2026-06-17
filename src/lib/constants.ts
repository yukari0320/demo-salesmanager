import type { VisitStatus, OrderStatus } from "./types";

export const MONTHS_JP = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export const STATUS_VISIT: VisitStatus[] = ["予定", "訪問済", "見込み", "失注"];
export const STATUS_ORDER: OrderStatus[] = ["受注", "準備中", "出荷待ち", "納品済"];

export const BADGE_COLOR: Record<string, string> = {
  予定: "#6C7EF5",
  訪問済: "#22C55E",
  見込み: "#F59E0B",
  失注: "#94A3B8",
  受注: "#6C7EF5",
  準備中: "#F59E0B",
  出荷待ち: "#FB923C",
  納品済: "#22C55E",
};

// Avatar palette for chat members
export const MEMBER_COLORS = [
  "#2563EB", "#16A34A", "#D97706", "#9333EA", "#DC2626",
];

export function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}
