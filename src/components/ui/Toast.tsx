import styles from "./ui.module.css";

export default function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className={styles.toast}>{msg}</div>;
}
