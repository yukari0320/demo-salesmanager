"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppData, SetData } from "@/lib/types";
import { EMPTY_STATE } from "@/lib/types";
import { loadData, saveData } from "@/lib/client-api";
import SummaryBar from "@/components/SummaryBar";
import Toast from "@/components/ui/Toast";
import Btn from "@/components/ui/Btn";
import VisitTab from "@/components/tabs/VisitTab";
import OrderTab from "@/components/tabs/OrderTab";
import DeliveryTab from "@/components/tabs/DeliveryTab";
import ReportTab from "@/components/tabs/ReportTab";
import ChatTab from "@/components/tabs/ChatTab";
import ui from "@/components/ui/ui.module.css";
import styles from "./page.module.css";

const TABS = [
  { label: "訪問", icon: "🗺️" },
  { label: "注文", icon: "📦" },
  { label: "納品", icon: "🚚" },
  { label: "レポート", icon: "📊" },
  { label: "チャット", icon: "💬" },
];

const NAME_KEY = "salesapp-myname-v1";

export default function App() {
  const [data, setDataRaw] = useState<AppData | null>(null);
  const [tab, setTab] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [myName, setMyName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Load shared data + restore this device's display name
  useEffect(() => {
    loadData().then((d) => {
      setDataRaw(d || EMPTY_STATE);
      setLoading(false);
    });
    setMyName(localStorage.getItem(NAME_KEY) || "");
  }, []);

  // Save on change
  const setData = useCallback<SetData>((updater) => {
    setDataRaw((prev) => {
      const base = prev ?? EMPTY_STATE;
      const next = typeof updater === "function" ? updater(base) : updater;
      setSyncing(true);
      saveData(next).finally(() => setSyncing(false));
      return next;
    });
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  };

  const commitName = (name: string) => {
    const v = name.trim();
    if (!v) return;
    setMyName(v);
    localStorage.setItem(NAME_KEY, v);
    setEditingName(false);
  };

  if (loading || !data) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingInner}>
          <div className={styles.loadingIcon}>📊</div>
          <div className={styles.loadingText}>読み込み中…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>📊</span>
          <div>
            <div className={styles.brandTitle}>営業管理</div>
            <div className={styles.brandSub}>チーム共有・リアルタイム同期</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.syncStatus} ${syncing ? styles.syncing : styles.synced}`}>
            {syncing ? "⏳ 保存中…" : "✓ 同期済"}
          </div>
          {/* 名前設定 */}
          {editingName ? (
            <div className={styles.nameEdit}>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName(nameInput);
                }}
                className={`${ui.input} ${styles.nameInput}`}
                placeholder="名前を入力"
              />
              <Btn small onClick={() => commitName(nameInput)}>
                OK
              </Btn>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameInput(myName);
                setEditingName(true);
              }}
              className={`${styles.nameBtn} ${myName ? styles.nameBtnSet : styles.nameBtnUnset}`}
            >
              {myName ? `👤 ${myName}` : "名前を設定"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.main}>
        <SummaryBar data={data} />

        {/* Tabs */}
        <div className={styles.tabBar}>
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i)}
              className={`${styles.tabBtn} ${tab === i ? styles.tabBtnActive : ""}`}
            >
              {t.icon}
              <br />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 0 && <VisitTab data={data} setData={setData} toast={toast} />}
        {tab === 1 && <OrderTab data={data} setData={setData} toast={toast} />}
        {tab === 2 && <DeliveryTab data={data} setData={setData} toast={toast} />}
        {tab === 3 && <ReportTab data={data} />}
        {tab === 4 && <ChatTab data={data} setData={setData} myName={myName} />}
      </div>

      <Toast msg={toastMsg} />
    </div>
  );
}
