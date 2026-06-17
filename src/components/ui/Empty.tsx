import styles from "./ui.module.css";

export default function Empty({
  icon = "📋",
  text,
  sub,
}: {
  icon?: string;
  text: string;
  sub?: string;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyText}>{text}</div>
      {sub && <div className={styles.emptySub}>{sub}</div>}
    </div>
  );
}
