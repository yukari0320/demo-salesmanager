"use client";

import { useEffect, useRef, useState } from "react";
import type { AppData, SetData } from "@/lib/types";
import { uid } from "@/lib/utils";
import { nameColor } from "@/lib/constants";
import Btn from "../ui/Btn";
import Empty from "../ui/Empty";
import ui from "../ui/ui.module.css";
import styles from "./ChatTab.module.css";

export default function ChatTab({
  data,
  setData,
  myName,
}: {
  data: AppData;
  setData: SetData;
  myName: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = data.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const send = () => {
    const t = text.trim();
    if (!t || !myName) return;
    setData((p) => ({
      ...p,
      messages: [
        ...(p.messages || []),
        {
          id: uid(),
          author: myName,
          text: t,
          at: new Date().toLocaleString("ja-JP", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    }));
    setText("");
  };

  const del = (id: string) =>
    setData((p) => ({ ...p, messages: p.messages.filter((m) => m.id !== id) }));

  return (
    <div className={styles.wrap}>
      {!myName && (
        <div className={styles.notice}>⚠️ まず右上の「名前」を設定してください</div>
      )}

      <div className={styles.feed}>
        {msgs.length === 0 && (
          <Empty
            icon="💬"
            text="チャットがまだありません"
            sub="チームメンバーにメッセージを送りましょう"
          />
        )}
        {msgs.map((m) => {
          const isMe = m.author === myName;
          return (
            <div key={m.id} className={`${styles.row} ${isMe ? styles.rowMe : ""}`}>
              {!isMe && (
                <div className={styles.avatar} style={{ background: nameColor(m.author) }}>
                  {m.author[0]}
                </div>
              )}
              <div className={`${styles.bubbleCol} ${isMe ? styles.bubbleColMe : ""}`}>
                {!isMe && <span className={styles.bubbleAuthor}>{m.author}</span>}
                <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                  {m.text}
                </div>
                <div className={styles.bubbleMeta}>
                  <span className={styles.bubbleTime}>{m.at}</span>
                  {isMe && (
                    <button onClick={() => del(m.id)} className={styles.delBtn}>
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className={styles.inputBar}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={myName ? "メッセージを入力… (Enterで送信)" : "名前を設定してから送信できます"}
          disabled={!myName}
          className={`${ui.input} ${styles.textarea}`}
          rows={1}
        />
        <Btn onClick={send} disabled={!text.trim() || !myName} style={{ flexShrink: 0, height: 42, padding: "0 16px" }}>
          送信
        </Btn>
      </div>
    </div>
  );
}
