import type { ReactNode } from "react";
import styles from "./ui.module.css";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} className={styles.modalClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
