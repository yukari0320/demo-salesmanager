"use client";

import { useState } from "react";
import type { AppData } from "@/lib/types";
import { MONTHS_JP } from "@/lib/constants";
import { yen } from "@/lib/utils";
import Empty from "../ui/Empty";
import ui from "../ui/ui.module.css";
import styles from "./ReportTab.module.css";

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ""}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={`${styles.statValue} ${accent ? styles.statValueAccent : ""}`}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

export default function ReportTab({ data }: { data: AppData }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const ordersInMonth = data.orders.filter((o) => {
    if (!o.orderedAt) return false;
    const d = new Date(o.orderedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const deliveredInMonth = data.deliveries.filter((d) => {
    if (!d.deliveredAt) return false;
    const dt = new Date(d.deliveredAt);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });
  const visitsInMonth = data.visits.filter((v) => {
    if (!v.date) return false;
    const d = new Date(v.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalSales = ordersInMonth.reduce(
    (s, o) => s + (Number(o.price) || 0) * Number(o.qty || 0),
    0
  );
  const deliveredSales = deliveredInMonth.reduce((s, d) => {
    const o = data.orders.find((x) => x.id === d.orderId);
    return s + (o ? (Number(o.price) || 0) * Number(o.qty || 0) : 0);
  }, 0);

  // 取引先別集計
  const byClient: Record<string, { orders: number; qty: number; sales: number }> = {};
  ordersInMonth.forEach((o) => {
    if (!byClient[o.client]) byClient[o.client] = { orders: 0, qty: 0, sales: 0 };
    byClient[o.client].orders++;
    byClient[o.client].qty += Number(o.qty || 0);
    byClient[o.client].sales += (Number(o.price) || 0) * Number(o.qty || 0);
  });
  const clientRows = Object.entries(byClient).sort((a, b) => b[1].sales - a[1].sales);

  // 商品別集計
  const byItem: Record<string, { qty: number; sales: number }> = {};
  ordersInMonth.forEach((o) => {
    if (!byItem[o.item]) byItem[o.item] = { qty: 0, sales: 0 };
    byItem[o.item].qty += Number(o.qty || 0);
    byItem[o.item].sales += (Number(o.price) || 0) * Number(o.qty || 0);
  });
  const itemRows = Object.entries(byItem).sort((a, b) => b[1].qty - a[1].qty);
  const maxQty = Math.max(0, ...itemRows.map((r) => r[1].qty));

  const years: number[] = [];
  const minY = Math.min(
    ...[...data.orders.map((o) => o.orderedAt), ...data.visits.map((v) => v.date)]
      .filter(Boolean)
      .map((d) => new Date(d).getFullYear()),
    now.getFullYear()
  );
  for (let y = minY; y <= now.getFullYear(); y++) years.push(y);

  return (
    <div>
      {/* 月選択 */}
      <div className={styles.monthBar}>
        <select
          className={`${ui.input} ${styles.yearSelect}`}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
        <div className={styles.monthChips}>
          {MONTHS_JP.map((m, i) => (
            <button
              key={i}
              onClick={() => setMonth(i)}
              className={`${styles.monthChip} ${month === i ? styles.monthChipActive : ""}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* サマリーカード */}
      <div className={styles.statRow}>
        <StatCard icon="🗺️" label="訪問件数" value={`${visitsInMonth.length}件`} />
        <StatCard
          icon="📦"
          label="受注件数"
          value={`${ordersInMonth.length}件`}
          sub={`受注額 ${yen(totalSales)}`}
        />
        <StatCard
          icon="🚚"
          label="納品件数"
          value={`${deliveredInMonth.length}件`}
          sub={`納品額 ${yen(deliveredSales)}`}
          accent={deliveredInMonth.length < ordersInMonth.length}
        />
      </div>

      {/* 取引先別 */}
      {clientRows.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>取引先別 受注</div>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadRow}>
                {["取引先", "件数", "数量", "売上"].map((h) => (
                  <th
                    key={h}
                    className={`${styles.th} ${h === "取引先" ? styles.thLeft : styles.thRight}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientRows.map(([name, v]) => (
                <tr key={name} className={styles.tbodyRow}>
                  <td className={`${styles.td} ${styles.tdName}`}>{name}</td>
                  <td className={`${styles.td} ${styles.tdNum}`}>{v.orders}</td>
                  <td className={`${styles.td} ${styles.tdNum}`}>{v.qty}</td>
                  <td className={`${styles.td} ${styles.tdSales}`}>{yen(v.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 商品別 */}
      {itemRows.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>商品別 受注数量</div>
          {itemRows.map(([name, v]) => {
            const pct = maxQty > 0 ? (v.qty / maxQty) * 100 : 0;
            return (
              <div key={name} className={styles.barItem}>
                <div className={styles.barHead}>
                  <span className={styles.barName}>{name}</span>
                  <span className={styles.barMeta}>
                    {v.qty}個　{yen(v.sales)}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ordersInMonth.length === 0 && visitsInMonth.length === 0 && (
        <Empty icon="📊" text={`${year}年${MONTHS_JP[month]}のデータがありません`} />
      )}
    </div>
  );
}
