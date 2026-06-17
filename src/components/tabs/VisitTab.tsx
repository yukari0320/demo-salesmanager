"use client";

import { useState } from "react";
import type { AppData, Comment, SetData, Toast, Visit, VisitStatus } from "@/lib/types";
import { STATUS_VISIT } from "@/lib/constants";
import { uid, fmt } from "@/lib/utils";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Modal from "../ui/Modal";
import Empty from "../ui/Empty";
import CommentSection from "../CommentSection";
import VisitForm, { type VisitFormValues } from "../forms/VisitForm";
import styles from "./tabs.module.css";

export default function VisitTab({
  data,
  setData,
  toast,
}: {
  data: AppData;
  setData: SetData;
  toast: Toast;
}) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Visit | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("すべて");
  const list = filter === "すべて" ? data.visits : data.visits.filter((v) => v.status === filter);

  const add = (f: VisitFormValues) => {
    setData((p) => ({ ...p, visits: [{ id: uid(), ...f }, ...p.visits] }));
    toast("訪問を記録しました");
  };
  const edit = (f: VisitFormValues) => {
    setData((p) => ({
      ...p,
      visits: p.visits.map((v) => (v.id === editItem?.id ? { ...v, ...f } : v)),
    }));
    toast("更新しました");
  };
  const del = (id: string) => {
    if (!window.confirm("この訪問記録を削除しますか？")) return;
    setData((p) => ({ ...p, visits: p.visits.filter((v) => v.id !== id) }));
    toast("削除しました");
  };
  const addComment = (c: Comment) => setData((p) => ({ ...p, comments: [c, ...p.comments] }));
  const delComment = (id: string) =>
    setData((p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }));

  return (
    <>
      <div className={styles.toolbar}>
        <Btn onClick={() => setOpen(true)}>＋ 訪問を記録</Btn>
        <div className={styles.chips}>
          {["すべて", ...STATUS_VISIT].map((s) => (
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

      {list.length === 0 && (
        <Empty text="訪問記録がありません" sub="「＋ 訪問を記録」から追加してください" />
      )}
      <div className={styles.list}>
        {list.map((v) => {
          const related = data.orders.filter((o) => o.visitId === v.id);
          const showComments = openComments[v.id];
          const commentCount = data.comments.filter((c) => c.targetId === v.id).length;
          return (
            <div key={v.id} className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardMain}>
                  <div className={styles.metaRow}>
                    <Badge s={v.status} />
                    <span className={styles.date}>{fmt(v.date)}</span>
                  </div>
                  <div className={styles.clientName}>{v.client}</div>
                  {v.address && <div className={styles.address}>📍 {v.address}</div>}
                  {v.memo && <div className={styles.memo}>{v.memo}</div>}
                  {related.length > 0 && (
                    <div className={styles.relatedRow}>
                      {related.map((o) => (
                        <span key={o.id} className={styles.relatedTag}>
                          {o.item} ×{o.qty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.sideCol}>
                  <select
                    className={styles.statusSelect}
                    value={v.status}
                    onChange={(e) => {
                      const status = e.target.value as VisitStatus;
                      setData((p) => ({
                        ...p,
                        visits: p.visits.map((x) => (x.id === v.id ? { ...x, status } : x)),
                      }));
                      toast("ステータスを更新しました");
                    }}
                  >
                    {STATUS_VISIT.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div className={styles.btnRow}>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        setEditItem(v);
                        setOpen(true);
                      }}
                    >
                      編集
                    </Btn>
                    <Btn small variant="danger" onClick={() => del(v.id)}>
                      削除
                    </Btn>
                  </div>
                </div>
              </div>
              <div className={styles.commentToggleRow}>
                <button
                  className={styles.commentToggle}
                  onClick={() => setOpenComments((p) => ({ ...p, [v.id]: !p[v.id] }))}
                >
                  💬 コメント{commentCount > 0 ? ` (${commentCount})` : ""}
                  {showComments ? " ▲" : " ▼"}
                </button>
              </div>
              {showComments && (
                <CommentSection
                  targetId={v.id}
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
          title={editItem ? "訪問を編集" : "訪問を記録"}
          onClose={() => {
            setOpen(false);
            setEditItem(null);
          }}
        >
          <VisitForm
            initial={editItem}
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
