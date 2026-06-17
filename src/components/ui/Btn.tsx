import type { CSSProperties, ReactNode } from "react";
import styles from "./ui.module.css";

type Variant = "primary" | "ghost" | "danger" | "success" | "outline";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: styles.btnPrimary,
  ghost: styles.btnGhost,
  danger: styles.btnDanger,
  success: styles.btnSuccess,
  outline: styles.btnOutline,
};

export default function Btn({
  children,
  onClick,
  variant = "primary",
  small,
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  small?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const cls = [styles.btn, small ? styles.btnSmall : "", VARIANT_CLASS[variant]]
    .filter(Boolean)
    .join(" ");
  return (
    <button onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}
