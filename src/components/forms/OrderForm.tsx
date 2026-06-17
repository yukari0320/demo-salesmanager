"use client";

import { useState } from "react";
import type { Order, Visit } from "@/lib/types";
import { STATUS_ORDER } from "@/lib/constants";
import { today, fmt } from "@/lib/utils";
import Field from "../ui/Field";
import Btn from "../ui/Btn";
import ui from "../ui/ui.module.css";

export type OrderFormValues = Omit<Order, "id">;

export default function OrderForm({
  initial,
  visits,
  onSave,
  onClose,
}: {
  initial?: Order | null;
  visits: Visit[];
  onSave: (f: OrderFormValues) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<OrderFormValues>(
    initial ?? {
      visitId: "",
      client: "",
      item: "",
      qty: "",
      price: "",
      orderedAt: today(),
      status: "受注",
    }
  );
  const set =
    (k: keyof OrderFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }) as OrderFormValues);
  const setVisit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = visits.find((x) => x.id === e.target.value);
    setF((p) => ({ ...p, visitId: e.target.value, client: v?.client || p.client }));
  };
  const ok = f.client && f.item && f.qty;

  return (
    <>
      {visits.length > 0 && (
        <Field label="訪問先と紐づける">
          <select className={ui.input} value={f.visitId} onChange={setVisit}>
            <option value="">— 紐づけない —</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {fmt(v.date)} {v.client}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="取引先名 *">
        <input
          className={ui.input}
          value={f.client}
          onChange={set("client")}
          placeholder="例：株式会社〇〇"
        />
      </Field>
      <Field label="商品名 *">
        <input className={ui.input} value={f.item} onChange={set("item")} placeholder="例：製品A" />
      </Field>
      <Field label="数量 *">
        <input type="number" min="1" className={ui.input} value={f.qty} onChange={set("qty")} />
      </Field>
      <Field label="単価（円）">
        <input type="number" min="0" className={ui.input} value={f.price} onChange={set("price")} />
      </Field>
      <Field label="受注日">
        <input type="date" className={ui.input} value={f.orderedAt} onChange={set("orderedAt")} />
      </Field>
      <Field label="ステータス">
        <select className={ui.input} value={f.status} onChange={set("status")}>
          {STATUS_ORDER.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
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
