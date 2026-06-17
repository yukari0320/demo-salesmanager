import { BADGE_COLOR } from "@/lib/constants";
import styles from "./ui.module.css";

export default function Badge({ s }: { s: string }) {
  return (
    <span className={styles.badge} style={{ background: BADGE_COLOR[s] || "var(--muted)" }}>
      {s}
    </span>
  );
}
