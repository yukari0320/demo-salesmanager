"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { uid, nowStr } from "@/lib/utils";
import Btn from "./ui/Btn";
import ui from "./ui/ui.module.css";
import styles from "./CommentSection.module.css";

export default function CommentSection({
  targetId,
  comments,
  onAdd,
  onDelete,
}: {
  targetId: string;
  comments: Comment[];
  onAdd: (c: Comment) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const mine = comments.filter((c) => c.targetId === targetId);

  const send = () => {
    if (!text.trim()) return;
    onAdd({
      id: uid(),
      targetId,
      author: author || "匿名",
      text: text.trim(),
      at: nowStr(),
    });
    setText("");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>💬 コメント ({mine.length})</div>
      {mine.map((c) => (
        <div key={c.id} className={styles.comment}>
          <div className={styles.commentHead}>
            <span className={styles.author}>{c.author}</span>
            <div className={styles.metaRow}>
              <span className={styles.at}>{c.at}</span>
              <button onClick={() => onDelete(c.id)} className={styles.delBtn}>
                ✕
              </button>
            </div>
          </div>
          <div className={styles.text}>{c.text}</div>
        </div>
      ))}
      <div className={styles.inputRow}>
        <input
          className={`${ui.input} ${styles.nameInput}`}
          placeholder="名前"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className={`${ui.input} ${styles.textInput}`}
          placeholder="コメントを入力…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Btn small onClick={send} disabled={!text.trim()} style={{ flexShrink: 0 }}>
          送信
        </Btn>
      </div>
    </div>
  );
}
