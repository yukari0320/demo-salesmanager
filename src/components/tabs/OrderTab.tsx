"use client";

import { useState } from "react";
import type { AppData, Comment, Order, OrderStatus, SetData, Toast } from "@/lib/types";
import { STATUS_ORDER } from "@/lib/constants";
import { uid, fmt, yen } from "@/lib/utils";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Modal from "../ui/Modal";
import Empty from "../ui/Empty";
import CommentSection from "../CommentSection";
import OrderForm, { type OrderFormValues } from "../forms/OrderForm";
import styles from "./tabs.module.css";

export default function OrderTab({
  data,
  setData,
  toast,
}: {
  data: AppData;
  setData: SetData;
  toast: Toast;
}) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Order | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("すべて");
  const list = filter === "すべて" ? data.orders : data.orders.filter((o) => o.status === filter);
  const total = list.reduce((s, o) => s + (Number(o.price) || 0) * Number(o.qty || 0), 0);

  const add = (f: OrderFormValues) => {
    setData((p) => ({ ...p, orders: [{ id: uid(), ...f }, ...p.orders] }));
    toast("注文を追加しました");
  };
  const edit = (f: OrderFormValues) => {
    setData((p) => ({
      ...p,
      orders: p.orders.map((o) => (o.id === editItem?.id ? { ...o, ...f } : o)),
    }));
    toast("更新しました");
  };
  const del = (id: string) => {
    if (!window.confirm("この注文を削除しますか？")) return;
    setData((p) => ({ ...p, orders: p.orders.filter((o) => o.id !== id) }));
    toast("削除しました");
  };
  const addComment = (c: Comment) => setData((p) => ({ ...p, comments: [c, ...p.comments] }));
  const delComment = (id: string) =>
    setData((p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }));

  return (
    <>
      <div className={styles.toolbar}>
        <Btn onClick={() => setOpen(true)}>＋ 注文を追加</Btn>
        <div className={styles.chips}>
          {["すべて", ...STATUS_ORDER].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`${styles.chip} ${filter === s ? styles.chipActive : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {list.length > 0 && (
        <div className={styles.totalBar}>
          <span>{list.length}件</span>
          <span className={styles.totalAmount}>合計 {yen(total)}</span>
        </div>
      )}
      {list.length === 0 && (
        <Empty text="注文がありません" sub="「＋ 注文を追加」から記録してください" />
      )}
      <div className={styles.list}>
        {list.map((o) => {
          const delivered = data.deliveries.filter((d) => d.orderId === o.id);
          const showC = openComments[o.id];
          const cCount = data.comments.filter((c) => c.targetId === o.id).length;
          return (
            <div key={o.id} className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardMain}>
                  <div className={styles.metaRow}>
                    <Badge s={o.status} />
                    <span className={styles.date}>{fmt(o.orderedAt)}</span>
                  </div>
                  <div className={`${styles.clientName} ${styles.clientNameSm}`}>{o.client}</div>
                  <div className={styles.orderLine}>
                    {o.item} <b>×{o.qty}個</b>
                    {o.price ? (
                      <span className={styles.orderPrice}>
                        {yen(o.price)}/個　計 {yen(Number(o.price) * Number(o.qty))}
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                  {delivered.map((d) => (
                    <div key={d.id} className={styles.deliveredNote}>
                      ✓ {fmt(d.deliveredAt)} 納品完了{d.memo ? ` — ${d.memo}` : ""}
                    </div>
                  ))}
                </div>
                <div className={styles.sideCol}>
                  <select
                    className={styles.statusSelect}
                    value={o.status}
                    onChange={(e) => {
                      const status = e.target.value as OrderStatus;
                      setData((p) => ({
                        ...p,
                        orders: p.orders.map((x) => (x.id === o.id ? { ...x, status } : x)),
                      }));
                      toast("ステータスを更新しました");
                    }}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div className={styles.btnRow}>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        setEditItem(o);
                        setOpen(true);
                      }}
                    >
                      編集
                    </Btn>
                    <Btn small variant="danger" onClick={() => del(o.id)}>
                      削除
                    </Btn>
                  </div>
                </div>
              </div>
              <div className={styles.commentToggleRow}>
                <button
                  className={styles.commentToggle}
                  onClick={() => setOpenComments((p) => ({ ...p, [o.id]: !p[o.id] }))}
                >
                  💬 コメント{cCount > 0 ? ` (${cCount})` : ""}
                  {showC ? " ▲" : " ▼"}
                </button>
              </div>
              {showC && (
                <CommentSection
                  targetId={o.id}
                  comments={data.comments}
                  onAdd={(c) => {
                    addComment(c);
                    toast("コメントを追加しました");
                  }}
                  onDelete={(id) => {
                    delComment(id);
                    toast("削除しました");
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {open && (
        <Modal
          title={editItem ? "注文を編集" : "注文を追加"}
          onClose={() => {
            setOpen(false);
            setEditItem(null);
          }}
        >
          <OrderForm
            initial={editItem}
            visits={data.visits}
            onSave={editItem ? edit : add}
            onClose={() => {
              setOpen(false);
              setEditItem(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
