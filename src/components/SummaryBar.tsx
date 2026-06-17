import type { AppData } from "@/lib/types";
import { yen } from "@/lib/utils";
import styles from "./SummaryBar.module.css";

export default function SummaryBar({ data }: { data: AppData }) {
  const pending = data.orders.filter((o) => o.status !== "納品済").length;
  const sales = data.orders.reduce((s, o) => s + (Number(o.price) || 0) * Number(o.qty || 0), 0);

  const cells: { icon: string; label: string; val: string | number; accent?: boolean; small?: boolean }[] = [
    { icon: "🗺️", label: "訪問", val: data.visits.length },
    { icon: "📦", label: "受注", val: data.orders.length },
    { icon: "🚚", label: "未納品", val: pending, accent: pending > 0 },
    { icon: "💴", label: "売上", val: yen(sales), small: true },
  ];

  return (
    <div className={styles.grid}>
      {cells.map((s) => (
        <div key={s.label} className={`${styles.cell} ${s.accent ? styles.cellAccent : ""}`}>
          <div className={styles.icon}>{s.icon}</div>
          <div
            className={`${styles.value} ${s.small ? styles.valueSm : ""} ${
              s.accent ? styles.valueAccent : ""
            }`}
          >
            {s.val}
          </div>
          <div className={styles.label}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
