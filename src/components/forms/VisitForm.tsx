"use client";

import { useState } from "react";
import type { Visit, VisitStatus } from "@/lib/types";
import { STATUS_VISIT } from "@/lib/constants";
import { today } from "@/lib/utils";
import Field from "../ui/Field";
import Btn from "../ui/Btn";
import ui from "../ui/ui.module.css";

export type VisitFormValues = Omit<Visit, "id">;

export default function VisitForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Visit | null;
  onSave: (f: VisitFormValues) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<VisitFormValues>(
    initial ?? { date: today(), client: "", address: "", memo: "", status: "予定" }
  );
  const set =
    (k: keyof VisitFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }) as VisitFormValues);
  const ok = f.date && f.client;

  return (
    <>
      <Field label="訪問日 *">
        <input type="date" className={ui.input} value={f.date} onChange={set("date")} />
      </Field>
      <Field label="取引先名 *">
        <input
          className={ui.input}
          placeholder="例：株式会社〇〇"
          value={f.client}
          onChange={set("client")}
        />
      </Field>
      <Field label="住所">
        <input
          className={ui.input}
          placeholder="例：東京都新宿区…"
          value={f.address}
          onChange={set("address")}
        />
      </Field>
      <Field label="ステータス">
        <select className={ui.input} value={f.status} onChange={set("status")}>
          {STATUS_VISIT.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="メモ">
        <textarea className={ui.input} value={f.memo} onChange={set("memo")} />
      </Field>
      <div className={ui.actions}>
        <Btn variant="ghost" onClick={onClose}>
          キャンセル
        </Btn>
        <Btn
          disabled={!ok}
          onClick={() => {
            if (!ok) return;
            onSave(f);
            onClose();
          }}
        >
          保存する
        </Btn>
      </div>
    </>
  );
}
