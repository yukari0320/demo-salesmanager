"use client";

import { useState } from "react";
import type { Delivery, Order } from "@/lib/types";
import { today, fmt, yen } from "@/lib/utils";
import Field from "../ui/Field";
import Btn from "../ui/Btn";
import ui from "../ui/ui.module.css";
import styles from "./DeliveryForm.module.css";

export type DeliveryFormValues = Omit<Delivery, "id">;

export default function DeliveryForm({
  initial,
  orders,
  onSave,
  onClose,
}: {
  initial?: Delivery | null;
  orders: Order[];
  onSave: (f: DeliveryFormValues) => void;
  onClose: () => void;
}) {
  const pending = orders.filter((o) => o.status !== "納品済");
  const [f, setF] = useState(
    initial ?? {
      orderId: pending[0]?.id || "",
      deliveredAt: today(),
      memo: "",
    }
  );
  const set =
    (k: "orderId" | "deliveredAt" | "memo") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));
  const order = orders.find((o) => o.id === f.orderId);
  const ok = !!order;

  return (
    <>
      <Field label="注文を選択 *">
        <select className={ui.input} value={f.orderId} onChange={set("orderId")}>
          {pending.length === 0 && <option value="">納品待ちの注文がありません</option>}
          {pending.map((o) => (
            <option key={o.id} value={o.id}>
              {fmt(o.orderedAt)} {o.client} — {o.item} ×{o.qty}
            </option>
          ))}
        </select>
      </Field>
      {order && (
        <div className={styles.preview}>
          <b>{order.client}</b>　{order.item} × <b>{order.qty}</b>個
          {yen(Number(order.price) * Number(order.qty) || "")}
        </div>
      )}
      <Field label="納品日">
        <input type="date" className={ui.input} value={f.deliveredAt} onChange={set("deliveredAt")} />
      </Field>
      <Field label="備考">
        <input
          className={ui.input}
          value={f.memo}
          onChange={set("memo")}
          placeholder="配送業者・連絡事項など"
        />
      </Field>
      <div className={ui.actions}>
        <Btn variant="ghost" onClick={onClose}>
          キャンセル
        </Btn>
        <Btn
          disabled={!ok}
          onClick={() => {
            if (!order) return;
            onSave({ ...f, client: order.client, item: order.item, qty: order.qty });
            onClose();
          }}
        >
          納品を記録する
        </Btn>
      </div>
    </>
  );
}
