"use client";

import { useState } from "react";
import type { AppData, SetData, Toast } from "@/lib/types";
import { uid, fmt } from "@/lib/utils";
import Btn from "../ui/Btn";
import Modal from "../ui/Modal";
import Empty from "../ui/Empty";
import DeliveryForm, { type DeliveryFormValues } from "../forms/DeliveryForm";
import styles from "./tabs.module.css";

export default function DeliveryTab({
  data,
  setData,
  toast,
}: {
  data: AppData;
  setData: SetData;
  toast: Toast;
}) {
  const [open, setOpen] = useState(false);

  const add = (f: DeliveryFormValues) => {
    setData((p) => ({
      ...p,
      deliveries: [{ id: uid(), ...f }, ...p.deliveries],
      orders: p.orders.map((o) => (o.id === f.orderId ? { ...o, status: "納品済" } : o)),
    }));
    toast("納品を記録しました");
  };
  const del = (id: string) => {
    if (!window.confirm("この納品記録を削除しますか？")) return;
    setData((p) => ({ ...p, deliveries: p.deliveries.filter((d) => d.id !== id) }));
    toast("削除しました");
  };

  return (
    <>
      <div className={styles.toolbarSimple}>
        <Btn onClick={() => setOpen(true)}>＋ 納品を記録</Btn>
      </div>
      {data.deliveries.length === 0 && (
        <Empty icon="🚚" text="納品記録がありません" sub="「＋ 納品を記録」から追加してください" />
      )}
      <div className={styles.list}>
        {data.deliveries.map((d) => {
          const order = data.orders.find((o) => o.id === d.orderId);
          return (
            <div key={d.id} className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardMain}>
                  <div className={styles.metaRow}>
                    <span className={styles.deliveredBadge}>納品完了</span>
                    <span className={styles.date}>{fmt(d.deliveredAt)}</span>
                  </div>
                  <div className={`${styles.clientName} ${styles.clientNameSm}`}>{d.client}</div>
                  <div className={styles.orderLine}>
                    {d.item} ×{d.qty}個
                  </div>
                  {order && <div className={styles.deliveryMeta}>受注日：{fmt(order.orderedAt)}</div>}
                  {d.memo && <div className={styles.memo}>{d.memo}</div>}
                </div>
                <Btn small variant="danger" onClick={() => del(d.id)}>
                  削除
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <Modal title="納品を記録" onClose={() => setOpen(false)}>
          <DeliveryForm orders={data.orders} onSave={add} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
