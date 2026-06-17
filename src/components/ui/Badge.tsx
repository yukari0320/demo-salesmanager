import type { CSSProperties } from "react";
import { BADGE_COLOR } from "@/lib/constants";
import styles from "./ui.module.css";

export default function Badge({ s }: { s: string }) {
  const color = BADGE_COLOR[s] || "#94a3b8";
  return (
    <span className={styles.badge} style={{ "--badge-c": color } as CSSProperties}>
      <span className={styles.badgeDot} />
      {s}
    </span>
  );
}
