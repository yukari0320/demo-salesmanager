import { useState, useEffect, useCallback } from "react";
import React from "react";

// ─────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────
const STORE_KEY = "salesapp-data-v1";

async function loadData() {
  try {
    const r = await window.storage.get(STORE_KEY, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function saveData(data) {
  try {
    await window.storage.set(STORE_KEY, JSON.stringify(data), true);
  } catch (e) { console.error(e); }
}

const EMPTY_STATE = { visits: [], orders: [], deliveries: [], comments: [], messages: [] };

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = d => d ? d.replace(/-/g, "/") : "—";
const yen = n => (n !== "" && n !== undefined && n !== null) ? `¥${Number(n).toLocaleString()}` : "—";
const nowStr = () => new Date().toLocaleString("ja-JP", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" });

const MONTHS_JP = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const STATUS_VISIT = ["予定","訪問済","見込み","失注"];
const STATUS_ORDER = ["受注","準備中","出荷待ち","納品済"];
const BADGE_COLOR = {
  "予定":"#6C7EF5","訪問済":"#22C55E","見込み":"#F59E0B","失注":"#94A3B8",
  "受注":"#6C7EF5","準備中":"#F59E0B","出荷待ち":"#FB923C","納品済":"#22C55E",
};

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: "#F0F4F8", card: "#FFFFFF", border: "#E2E8F0",
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryText: "#1D4ED8",
  text: "#1E293B", sub: "#64748B", muted: "#94A3B8",
  success: "#16A34A", successLight: "#DCFCE7",
  warn: "#EA580C", warnLight: "#FFF7ED",
  danger: "#DC2626", dangerLight: "#FEE2E2",
};

const inputSt = {
  width:"100%", border:`1.5px solid ${C.border}`, borderRadius:8,
  padding:"9px 11px", fontSize:14, color:C.text, boxSizing:"border-box",
  background:"#fff", outline:"none", fontFamily:"inherit",
};

// ─────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────
function Badge({ s }) {
  return <span style={{ background: BADGE_COLOR[s]||C.muted, color:"#fff", borderRadius:20,
    padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{s}</span>;
}

function Btn({ children, onClick, variant="primary", small, disabled, style:sx={} }) {
  const V = {
    primary: { background:C.primary, color:"#fff" },
    ghost:   { background:"#F1F5F9", color:C.sub },
    danger:  { background:C.dangerLight, color:C.danger },
    success: { background:C.successLight, color:C.success },
    outline: { background:"#fff", color:C.primary, border:`1.5px solid ${C.primary}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border:"none", borderRadius:8, cursor: disabled?"not-allowed":"pointer",
      fontWeight:600, fontSize: small?12:14, padding: small?"5px 11px":"9px 18px",
      opacity: disabled ? 0.5 : 1, transition:"opacity .15s", fontFamily:"inherit",
      ...V[variant], ...sx
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.sub, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}
      onClick={onClose}>
      <div style={{ background:C.card, borderRadius:16, padding:"24px 20px", width:"100%",
        maxWidth:480, boxShadow:"0 24px 64px rgba(15,23,42,.3)", maxHeight:"92vh", overflowY:"auto" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>{title}</h3>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:22,
            cursor:"pointer", color:C.muted, lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  return msg ? (
    <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background:"#1E293B", color:"#fff", borderRadius:10, padding:"10px 20px",
      fontSize:13, fontWeight:600, zIndex:300, whiteSpace:"nowrap",
      boxShadow:"0 4px 20px rgba(15,23,42,.3)" }}>{msg}</div>
  ) : null;
}

function Empty({ icon="📋", text, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", color:C.muted }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:700, fontSize:15, color:C.sub }}>{text}</div>
      {sub && <div style={{ fontSize:13, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMMENT SECTION
// ─────────────────────────────────────────────
function CommentSection({ targetId, comments, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const mine = comments.filter(c => c.targetId === targetId);
  const send = () => {
    if (!text.trim()) return;
    onAdd({ id:uid(), targetId, author: author||"匿名", text:text.trim(), at: nowStr() });
    setText("");
  };
  return (
    <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.sub, marginBottom:8 }}>💬 コメント ({mine.length})</div>
      {mine.map(c => (
        <div key={c.id} style={{ background:"#F8FAFC", borderRadius:8, padding:"8px 10px",
          marginBottom:6, fontSize:13 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <span style={{ fontWeight:700, color:C.primary, fontSize:12 }}>{c.author}</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:11, color:C.muted }}>{c.at}</span>
              <button onClick={() => onDelete(c.id)} style={{ border:"none", background:"none",
                cursor:"pointer", color:C.muted, fontSize:13, padding:0 }}>✕</button>
            </div>
          </div>
          <div style={{ color:C.text }}>{c.text}</div>
        </div>
      ))}
      <div style={{ display:"flex", gap:6, marginTop:8 }}>
        <input style={{ ...inputSt, width:80, padding:"6px 8px", fontSize:12, flexShrink:0 }}
          placeholder="名前" value={author} onChange={e=>setAuthor(e.target.value)} />
        <input style={{ ...inputSt, fontSize:12, padding:"6px 8px" }}
          placeholder="コメントを入力…" value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()} />
        <Btn small onClick={send} disabled={!text.trim()} sx={{ flexShrink:0 }}>送信</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VISIT FORM
// ─────────────────────────────────────────────
function VisitForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || { date:today(), client:"", address:"", memo:"", status:"予定" });
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const ok = f.date && f.client;
  return (
    <>
      <Field label="訪問日 *"><input type="date" style={inputSt} value={f.date} onChange={set("date")} /></Field>
      <Field label="取引先名 *"><input style={inputSt} placeholder="例：株式会社〇〇" value={f.client} onChange={set("client")} /></Field>
      <Field label="住所"><input style={inputSt} placeholder="例：東京都新宿区…" value={f.address} onChange={set("address")} /></Field>
      <Field label="ステータス">
        <select style={inputSt} value={f.status} onChange={set("status")}>
          {STATUS_VISIT.map(s=><option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="メモ"><textarea style={{...inputSt,resize:"vertical",minHeight:64}} value={f.memo} onChange={set("memo")} /></Field>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>キャンセル</Btn>
        <Btn disabled={!ok} onClick={()=>ok&&(onSave(f),onClose())}>保存する</Btn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// ORDER FORM
// ─────────────────────────────────────────────
function OrderForm({ initial, visits, onSave, onClose }) {
  const def = initial || { visitId:"", client:"", item:"", qty:"", price:"", orderedAt:today(), status:"受注" };
  const [f, setF] = useState(def);
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const setVisit = e => {
    const v = visits.find(x=>x.id===e.target.value);
    setF(p=>({...p, visitId:e.target.value, client: v?.client || p.client}));
  };
  const ok = f.client && f.item && f.qty;
  return (
    <>
      {visits.length > 0 && (
        <Field label="訪問先と紐づける">
          <select style={inputSt} value={f.visitId} onChange={setVisit}>
            <option value="">— 紐づけない —</option>
            {visits.map(v=><option key={v.id} value={v.id}>{fmt(v.date)} {v.client}</option>)}
          </select>
        </Field>
      )}
      <Field label="取引先名 *"><input style={inputSt} value={f.client} onChange={set("client")} placeholder="例：株式会社〇〇" /></Field>
      <Field label="商品名 *"><input style={inputSt} value={f.item} onChange={set("item")} placeholder="例：製品A" /></Field>
      <Field label="数量 *"><input type="number" min="1" style={inputSt} value={f.qty} onChange={set("qty")} /></Field>
      <Field label="単価（円）"><input type="number" min="0" style={inputSt} value={f.price} onChange={set("price")} /></Field>
      <Field label="受注日"><input type="date" style={inputSt} value={f.orderedAt} onChange={set("orderedAt")} /></Field>
      <Field label="ステータス">
        <select style={inputSt} value={f.status} onChange={set("status")}>
          {STATUS_ORDER.map(s=><option key={s}>{s}</option>)}
        </select>
      </Field>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>キャンセル</Btn>
        <Btn disabled={!ok} onClick={()=>ok&&(onSave(f),onClose())}>保存する</Btn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DELIVERY FORM
// ─────────────────────────────────────────────
function DeliveryForm({ initial, orders, onSave, onClose }) {
  const pending = orders.filter(o=>o.status!=="納品済");
  const def = initial || { orderId: pending[0]?.id||"", deliveredAt:today(), memo:"" };
  const [f, setF] = useState(def);
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const order = orders.find(o=>o.id===f.orderId);
  const ok = order;
  return (
    <>
      <Field label="注文を選択 *">
        <select style={inputSt} value={f.orderId} onChange={set("orderId")}>
          {pending.length===0&&<option value="">納品待ちの注文がありません</option>}
          {pending.map(o=><option key={o.id} value={o.id}>{fmt(o.orderedAt)} {o.client} — {o.item} ×{o.qty}</option>)}
        </select>
      </Field>
      {order && (
        <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 14px",
          marginBottom:14, fontSize:13, color:C.sub }}>
          <b>{order.client}</b>　{order.item} × <b>{order.qty}</b>個　{yen(Number(order.price)*Number(order.qty)||"")}
        </div>
      )}
      <Field label="納品日"><input type="date" style={inputSt} value={f.deliveredAt} onChange={set("deliveredAt")} /></Field>
      <Field label="備考"><input style={inputSt} value={f.memo} onChange={set("memo")} placeholder="配送業者・連絡事項など" /></Field>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>キャンセル</Btn>
        <Btn disabled={!ok} onClick={()=>ok&&(onSave({...f, client:order.client, item:order.item, qty:order.qty}),onClose())}>納品を記録する</Btn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// VISIT TAB
// ─────────────────────────────────────────────
function VisitTab({ data, setData, toast }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [filter, setFilter] = useState("すべて");
  const list = filter==="すべて" ? data.visits : data.visits.filter(v=>v.status===filter);

  const add = f => {
    setData(p=>({ ...p, visits:[{ id:uid(), ...f }, ...p.visits] }));
    toast("訪問を記録しました");
  };
  const edit = f => {
    setData(p=>({ ...p, visits: p.visits.map(v=>v.id===editItem.id?{...v,...f}:v) }));
    toast("更新しました");
  };
  const del = id => {
    if (!window.confirm("この訪問記録を削除しますか？")) return;
    setData(p=>({ ...p, visits: p.visits.filter(v=>v.id!==id) }));
    toast("削除しました");
  };
  const addComment = c => {
    setData(p=>({ ...p, comments:[c,...p.comments] }));
  };
  const delComment = id => {
    setData(p=>({ ...p, comments: p.comments.filter(c=>c.id!==id) }));
  };

  return (
    <>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <Btn onClick={()=>setOpen(true)}>＋ 訪問を記録</Btn>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["すべて",...STATUS_VISIT].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{
              border:`1.5px solid ${filter===s?C.primary:C.border}`,
              background: filter===s?C.primaryLight:"#fff",
              color: filter===s?C.primaryText:C.sub,
              borderRadius:20, padding:"4px 11px", fontSize:12, fontWeight:600, cursor:"pointer"
            }}>{s}</button>
          ))}
        </div>
      </div>

      {list.length===0 && <Empty text="訪問記録がありません" sub="「＋ 訪問を記録」から追加してください" />}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map(v => {
          const related = data.orders.filter(o=>o.visitId===v.id);
          const showComments = openComments[v.id];
          const commentCount = data.comments.filter(c=>c.targetId===v.id).length;
          return (
            <div key={v.id} style={{ background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <Badge s={v.status} />
                    <span style={{ fontSize:12, color:C.muted }}>{fmt(v.date)}</span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:16, color:C.text }}>{v.client}</div>
                  {v.address && <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>📍 {v.address}</div>}
                  {v.memo && <div style={{ fontSize:13, color:C.sub, marginTop:6 }}>{v.memo}</div>}
                  {related.length>0 && (
                    <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap" }}>
                      {related.map(o=>(
                        <span key={o.id} style={{ background:C.primaryLight, color:C.primaryText,
                          borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>
                          {o.item} ×{o.qty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                  <select value={v.status}
                    onChange={e=>{
                      setData(p=>({...p,visits:p.visits.map(x=>x.id===v.id?{...x,status:e.target.value}:x)}));
                      toast("ステータスを更新しました");
                    }}
                    style={{ border:`1.5px solid ${C.border}`, borderRadius:6, padding:"4px 6px",
                      fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                    {STATUS_VISIT.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:4 }}>
                    <Btn small variant="ghost" onClick={()=>{setEditItem(v);setOpen(true);}}>編集</Btn>
                    <Btn small variant="danger" onClick={()=>del(v.id)}>削除</Btn>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:10, display:"flex", gap:8 }}>
                <button onClick={()=>setOpenComments(p=>({...p,[v.id]:!p[v.id]}))}
                  style={{ border:"none", background:"none", cursor:"pointer",
                    fontSize:12, color:C.primary, fontWeight:600, padding:0 }}>
                  💬 コメント{commentCount>0?` (${commentCount})`:""}
                  {showComments?" ▲":" ▼"}
                </button>
              </div>
              {showComments && (
                <CommentSection targetId={v.id} comments={data.comments}
                  onAdd={c=>{addComment(c);toast("コメントを追加しました");}}
                  onDelete={id=>{delComment(id);toast("削除しました");}} />
              )}
            </div>
          );
        })}
      </div>
      {open && (
        <Modal title={editItem?"訪問を編集":"訪問を記録"} onClose={()=>{setOpen(false);setEditItem(null);}}>
          <VisitForm initial={editItem}
            onSave={editItem?edit:add}
            onClose={()=>{setOpen(false);setEditItem(null);}} />
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// ORDER TAB
// ─────────────────────────────────────────────
function OrderTab({ data, setData, toast }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [filter, setFilter] = useState("すべて");
  const list = filter==="すべて" ? data.orders : data.orders.filter(o=>o.status===filter);
  const total = list.reduce((s,o)=>s+(Number(o.price)||0)*Number(o.qty||0),0);

  const add = f => {
    setData(p=>({...p, orders:[{id:uid(),...f},...p.orders]}));
    toast("注文を追加しました");
  };
  const edit = f => {
    setData(p=>({...p, orders:p.orders.map(o=>o.id===editItem.id?{...o,...f}:o)}));
    toast("更新しました");
  };
  const del = id => {
    if (!window.confirm("この注文を削除しますか？")) return;
    setData(p=>({...p, orders:p.orders.filter(o=>o.id!==id)}));
    toast("削除しました");
  };
  const addComment = c => setData(p=>({...p,comments:[c,...p.comments]}));
  const delComment = id => setData(p=>({...p,comments:p.comments.filter(c=>c.id!==id)}));

  return (
    <>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        <Btn onClick={()=>setOpen(true)}>＋ 注文を追加</Btn>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["すべて",...STATUS_ORDER].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{
              border:`1.5px solid ${filter===s?C.primary:C.border}`,
              background: filter===s?C.primaryLight:"#fff",
              color: filter===s?C.primaryText:C.sub,
              borderRadius:20, padding:"4px 11px", fontSize:12, fontWeight:600, cursor:"pointer"
            }}>{s}</button>
          ))}
        </div>
      </div>
      {list.length>0 && (
        <div style={{ background:C.primaryLight, borderRadius:10, padding:"10px 16px",
          marginBottom:14, display:"flex", justifyContent:"space-between",
          fontSize:13, color:C.primaryText }}>
          <span>{list.length}件</span>
          <span style={{ fontWeight:700 }}>合計 {yen(total)}</span>
        </div>
      )}
      {list.length===0 && <Empty text="注文がありません" sub="「＋ 注文を追加」から記録してください" />}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map(o => {
          const delivered = data.deliveries.filter(d=>d.orderId===o.id);
          const showC = openComments[o.id];
          const cCount = data.comments.filter(c=>c.targetId===o.id).length;
          return (
            <div key={o.id} style={{ background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <Badge s={o.status} />
                    <span style={{ fontSize:12, color:C.muted }}>{fmt(o.orderedAt)}</span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{o.client}</div>
                  <div style={{ fontSize:14, color:C.sub, marginTop:3 }}>
                    {o.item} <b>×{o.qty}個</b>
                    {o.price ? <span style={{ marginLeft:8, color:C.primary, fontWeight:600 }}>
                      {yen(o.price)}/個　計 {yen(Number(o.price)*Number(o.qty))}</span> : ""}
                  </div>
                  {delivered.map(d=>(
                    <div key={d.id} style={{ marginTop:5, fontSize:12, color:C.success }}>
                      ✓ {fmt(d.deliveredAt)} 納品完了{d.memo?` — ${d.memo}`:""}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                  <select value={o.status}
                    onChange={e=>{
                      setData(p=>({...p,orders:p.orders.map(x=>x.id===o.id?{...x,status:e.target.value}:x)}));
                      toast("ステータスを更新しました");
                    }}
                    style={{ border:`1.5px solid ${C.border}`, borderRadius:6,
                      padding:"4px 6px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                    {STATUS_ORDER.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:4 }}>
                    <Btn small variant="ghost" onClick={()=>{setEditItem(o);setOpen(true);}}>編集</Btn>
                    <Btn small variant="danger" onClick={()=>del(o.id)}>削除</Btn>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:10 }}>
                <button onClick={()=>setOpenComments(p=>({...p,[o.id]:!p[o.id]}))}
                  style={{ border:"none", background:"none", cursor:"pointer",
                    fontSize:12, color:C.primary, fontWeight:600, padding:0 }}>
                  💬 コメント{cCount>0?` (${cCount})`:""}{showC?" ▲":" ▼"}
                </button>
              </div>
              {showC && (
                <CommentSection targetId={o.id} comments={data.comments}
                  onAdd={c=>{addComment(c);toast("コメントを追加しました");}}
                  onDelete={id=>{delComment(id);toast("削除しました");}} />
              )}
            </div>
          );
        })}
      </div>
      {open && (
        <Modal title={editItem?"注文を編集":"注文を追加"} onClose={()=>{setOpen(false);setEditItem(null);}}>
          <OrderForm initial={editItem} visits={data.visits}
            onSave={editItem?edit:add}
            onClose={()=>{setOpen(false);setEditItem(null);}} />
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// DELIVERY TAB
// ─────────────────────────────────────────────
function DeliveryTab({ data, setData, toast }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const add = f => {
    setData(p=>({
      ...p,
      deliveries:[{id:uid(),...f},...p.deliveries],
      orders: p.orders.map(o=>o.id===f.orderId?{...o,status:"納品済"}:o)
    }));
    toast("納品を記録しました");
  };
  const del = id => {
    if (!window.confirm("この納品記録を削除しますか？")) return;
    setData(p=>({...p, deliveries:p.deliveries.filter(d=>d.id!==id)}));
    toast("削除しました");
  };

  return (
    <>
      <div style={{ marginBottom:14 }}>
        <Btn onClick={()=>setOpen(true)}>＋ 納品を記録</Btn>
      </div>
      {data.deliveries.length===0 && <Empty icon="🚚" text="納品記録がありません" sub="「＋ 納品を記録」から追加してください" />}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {data.deliveries.map(d => {
          const order = data.orders.find(o=>o.id===d.orderId);
          return (
            <div key={d.id} style={{ background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ background:C.successLight, color:C.success,
                      borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>納品完了</span>
                    <span style={{ fontSize:12, color:C.muted }}>{fmt(d.deliveredAt)}</span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{d.client}</div>
                  <div style={{ fontSize:14, color:C.sub, marginTop:3 }}>{d.item} ×{d.qty}個</div>
                  {order && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>受注日：{fmt(order.orderedAt)}</div>}
                  {d.memo && <div style={{ fontSize:13, color:C.sub, marginTop:5 }}>{d.memo}</div>}
                </div>
                <Btn small variant="danger" onClick={()=>del(d.id)}>削除</Btn>
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <Modal title="納品を記録" onClose={()=>{setOpen(false);setEditItem(null);}}>
          <DeliveryForm initial={editItem} orders={data.orders}
            onSave={add} onClose={()=>{setOpen(false);setEditItem(null);}} />
        </Modal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// REPORT TAB
// ─────────────────────────────────────────────
function ReportTab({ data }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const ordersInMonth = data.orders.filter(o => {
    if (!o.orderedAt) return false;
    const d = new Date(o.orderedAt);
    return d.getFullYear()===year && d.getMonth()===month;
  });
  const deliveredInMonth = data.deliveries.filter(d => {
    if (!d.deliveredAt) return false;
    const dt = new Date(d.deliveredAt);
    return dt.getFullYear()===year && dt.getMonth()===month;
  });
  const visitsInMonth = data.visits.filter(v => {
    if (!v.date) return false;
    const d = new Date(v.date);
    return d.getFullYear()===year && d.getMonth()===month;
  });

  const totalSales = ordersInMonth.reduce((s,o)=>s+(Number(o.price)||0)*Number(o.qty||0),0);
  const deliveredSales = deliveredInMonth.reduce((s,d)=>{
    const o = data.orders.find(x=>x.id===d.orderId);
    return s + (o ? (Number(o.price)||0)*Number(o.qty||0) : 0);
  },0);

  // 取引先別集計
  const byClient = {};
  ordersInMonth.forEach(o=>{
    if(!byClient[o.client]) byClient[o.client]={orders:0,qty:0,sales:0};
    byClient[o.client].orders++;
    byClient[o.client].qty += Number(o.qty||0);
    byClient[o.client].sales += (Number(o.price)||0)*Number(o.qty||0);
  });
  const clientRows = Object.entries(byClient).sort((a,b)=>b[1].sales-a[1].sales);

  // 商品別集計
  const byItem = {};
  ordersInMonth.forEach(o=>{
    if(!byItem[o.item]) byItem[o.item]={qty:0,sales:0};
    byItem[o.item].qty += Number(o.qty||0);
    byItem[o.item].sales += (Number(o.price)||0)*Number(o.qty||0);
  });
  const itemRows = Object.entries(byItem).sort((a,b)=>b[1].qty-a[1].qty);

  const years = [];
  const minY = Math.min(...[...data.orders.map(o=>o.orderedAt),...data.visits.map(v=>v.date)]
    .filter(Boolean).map(d=>new Date(d).getFullYear()), now.getFullYear());
  for (let y=minY; y<=now.getFullYear(); y++) years.push(y);

  const statCard = (icon, label, value, sub, accent) => (
    <div style={{ background: accent?C.warnLight:C.card, border:`1.5px solid ${accent?"#FED7AA":C.border}`,
      borderRadius:12, padding:"14px 16px", flex:"1 1 140px" }}>
      <div style={{ fontSize:22 }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:20, color:accent?C.warn:C.text, margin:"4px 0 2px" }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* 月選択 */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18, flexWrap:"wrap" }}>
        <select style={{ ...inputSt, width:"auto" }} value={year} onChange={e=>setYear(Number(e.target.value))}>
          {years.map(y=><option key={y} value={y}>{y}年</option>)}
        </select>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {MONTHS_JP.map((m,i)=>(
            <button key={i} onClick={()=>setMonth(i)} style={{
              border:`1.5px solid ${month===i?C.primary:C.border}`,
              background: month===i?C.primaryLight:"#fff",
              color: month===i?C.primaryText:C.sub,
              borderRadius:20, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer"
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* サマリーカード */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
        {statCard("🗺️","訪問件数",visitsInMonth.length+"件")}
        {statCard("📦","受注件数",ordersInMonth.length+"件", `受注額 ${yen(totalSales)}`)}
        {statCard("🚚","納品件数",deliveredInMonth.length+"件", `納品額 ${yen(deliveredSales)}`, deliveredInMonth.length<ordersInMonth.length)}
      </div>

      {/* 取引先別 */}
      {clientRows.length > 0 && (
        <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12,
          padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:12 }}>取引先別 受注</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1.5px solid ${C.border}` }}>
                {["取引先","件数","数量","売上"].map(h=>(
                  <th key={h} style={{ textAlign:h==="取引先"?"left":"right",
                    padding:"4px 8px", color:C.sub, fontWeight:700, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientRows.map(([name,v])=>(
                <tr key={name} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"8px 8px", fontWeight:600, color:C.text }}>{name}</td>
                  <td style={{ padding:"8px 8px", textAlign:"right", color:C.sub }}>{v.orders}</td>
                  <td style={{ padding:"8px 8px", textAlign:"right", color:C.sub }}>{v.qty}</td>
                  <td style={{ padding:"8px 8px", textAlign:"right", fontWeight:700, color:C.primary }}>{yen(v.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 商品別 */}
      {itemRows.length > 0 && (
        <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12,
          padding:"14px 16px" }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:12 }}>商品別 受注数量</div>
          {itemRows.map(([name,v])=>{
            const maxQty = Math.max(...itemRows.map(r=>r[1].qty));
            const pct = maxQty > 0 ? (v.qty/maxQty)*100 : 0;
            return (
              <div key={name} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                  <span style={{ fontWeight:600, color:C.text }}>{name}</span>
                  <span style={{ color:C.sub }}>{v.qty}個　{yen(v.sales)}</span>
                </div>
                <div style={{ background:C.border, borderRadius:99, height:6 }}>
                  <div style={{ background:C.primary, width:`${pct}%`, borderRadius:99, height:6,
                    transition:"width .4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ordersInMonth.length===0 && visitsInMonth.length===0 && (
        <Empty icon="📊" text={`${year}年${MONTHS_JP[month]}のデータがありません`} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CHAT TAB
// ─────────────────────────────────────────────
const MEMBER_COLORS = ["#2563EB","#16A34A","#D97706","#9333EA","#DC2626"];
function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}

function ChatTab({ data, setData, myName, toast }) {
  const [text, setText] = useState("");
  const endRef = React.useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [data.messages?.length]);

  const send = () => {
    const t = text.trim();
    if (!t || !myName) return;
    setData(p => ({
      ...p,
      messages: [...(p.messages||[]), {
        id: uid(), author: myName, text: t,
        at: new Date().toLocaleString("ja-JP", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" })
      }]
    }));
    setText("");
  };

  const del = id => {
    setData(p => ({ ...p, messages: p.messages.filter(m => m.id !== id) }));
  };

  const msgs = data.messages || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 220px)", minHeight:300 }}>
      {/* 名前未設定の場合 */}
      {!myName && (
        <div style={{ background:"#FFF7ED", border:`1.5px solid #FED7AA`, borderRadius:10,
          padding:"12px 14px", marginBottom:12, fontSize:13, color:"#92400E", fontWeight:600 }}>
          ⚠️ まず右上の「名前」を設定してください
        </div>
      )}

      {/* メッセージ一覧 */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column",
        gap:10, padding:"4px 0 12px" }}>
        {msgs.length === 0 && (
          <Empty icon="💬" text="チャットがまだありません" sub="チームメンバーにメッセージを送りましょう" />
        )}
        {msgs.map(m => {
          const isMe = m.author === myName;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection: isMe?"row-reverse":"row",
              alignItems:"flex-end", gap:8 }}>
              {/* アバター */}
              {!isMe && (
                <div style={{ width:32, height:32, borderRadius:"50%", background: nameColor(m.author),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {m.author[0]}
                </div>
              )}
              <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column",
                alignItems: isMe?"flex-end":"flex-start", gap:3 }}>
                {!isMe && <span style={{ fontSize:11, color:C.sub, fontWeight:700, paddingLeft:2 }}>{m.author}</span>}
                <div style={{ background: isMe ? C.primary : C.card,
                  color: isMe ? "#fff" : C.text,
                  border: isMe ? "none" : `1.5px solid ${C.border}`,
                  borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding:"10px 14px", fontSize:14, lineHeight:1.5,
                  boxShadow:"0 1px 4px rgba(15,23,42,.07)" }}>
                  {m.text}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:10, color:C.muted }}>{m.at}</span>
                  {isMe && (
                    <button onClick={()=>del(m.id)} style={{ border:"none", background:"none",
                      cursor:"pointer", fontSize:10, color:C.muted, padding:0 }}>削除</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* 入力欄 */}
      <div style={{ borderTop:`1.5px solid ${C.border}`, paddingTop:12,
        display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
          placeholder={myName ? "メッセージを入力… (Enterで送信)" : "名前を設定してから送信できます"}
          disabled={!myName}
          style={{ ...inputSt, resize:"none", minHeight:42, maxHeight:100, lineHeight:1.5,
            flex:1, fontSize:14, padding:"10px 12px" }}
          rows={1}
        />
        <Btn onClick={send} disabled={!text.trim() || !myName}
          style={{ flexShrink:0, height:42, padding:"0 16px" }}>送信</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUMMARY BAR
// ─────────────────────────────────────────────
function SummaryBar({ data }) {
  const pending = data.orders.filter(o=>o.status!=="納品済").length;
  const sales = data.orders.reduce((s,o)=>s+(Number(o.price)||0)*Number(o.qty||0),0);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
      {[
        { icon:"🗺️", label:"訪問", val:data.visits.length },
        { icon:"📦", label:"受注", val:data.orders.length },
        { icon:"🚚", label:"未納品", val:pending, accent:pending>0 },
        { icon:"💴", label:"売上", val:yen(sales), small:true },
      ].map(s=>(
        <div key={s.label} style={{ background:s.accent?C.warnLight:C.card,
          border:`1.5px solid ${s.accent?"#FED7AA":C.border}`,
          borderRadius:10, padding:"10px 8px", textAlign:"center",
          boxShadow:"0 1px 4px rgba(15,23,42,.05)" }}>
          <div style={{ fontSize:18 }}>{s.icon}</div>
          <div style={{ fontWeight:800, fontSize:s.small?13:18,
            color:s.accent?C.warn:C.primary, margin:"3px 0 1px" }}>{s.val}</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
const TABS = [
  { label:"訪問", icon:"🗺️" },
  { label:"注文", icon:"📦" },
  { label:"納品", icon:"🚚" },
  { label:"レポート", icon:"📊" },
  { label:"チャット", icon:"💬" },
];

export default function App() {
  const [data, setDataRaw] = useState(null);
  const [tab, setTab] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [myName, setMyName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Load on mount
  useEffect(() => {
    loadData().then(d => {
      setDataRaw(d || EMPTY_STATE);
      setLoading(false);
    });
  }, []);

  // Save on change
  const setData = useCallback(updater => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSyncing(true);
      saveData(next).finally(() => setSyncing(false));
      return next;
    });
  }, []);

  const toast = msg => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bg, fontFamily:"'Hiragino Sans','Yu Gothic UI',sans-serif" }}>
      <div style={{ textAlign:"center", color:C.sub }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
        <div style={{ fontWeight:700 }}>読み込み中…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg,
      fontFamily:"'Hiragino Sans','Yu Gothic UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1.5px solid ${C.border}`,
        padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>📊</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.text }}>営業管理</div>
            <div style={{ fontSize:10, color:C.muted }}>チーム共有・リアルタイム同期</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:11, color: syncing?C.warn:C.success, fontWeight:600 }}>
            {syncing ? "⏳ 保存中…" : "✓ 同期済"}
          </div>
          {/* 名前設定 */}
          {editingName ? (
            <div style={{ display:"flex", gap:4 }}>
              <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && nameInput.trim()){ setMyName(nameInput.trim()); setEditingName(false); }}}
                style={{ ...inputSt, width:90, padding:"4px 8px", fontSize:12 }}
                placeholder="名前を入力" />
              <Btn small onClick={()=>{ if(nameInput.trim()){ setMyName(nameInput.trim()); setEditingName(false); }}}>OK</Btn>
            </div>
          ) : (
            <button onClick={()=>{ setNameInput(myName); setEditingName(true); }}
              style={{ border:`1.5px solid ${C.border}`, borderRadius:20, padding:"4px 12px",
                background: myName ? C.primaryLight : "#FFF7ED",
                color: myName ? C.primaryText : C.warn,
                fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {myName ? `👤 ${myName}` : "名前を設定"}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"14px 14px 90px" }}>
        <SummaryBar data={data} />

        {/* Tabs */}
        <div style={{ display:"flex", background:"#E8EDF5", borderRadius:12,
          padding:4, marginBottom:16, gap:3 }}>
          {TABS.map((t,i)=>(
            <button key={t.label} onClick={()=>setTab(i)} style={{
              flex:1, border:"none", borderRadius:9, padding:"8px 0",
              background: tab===i?"#fff":"transparent",
              color: tab===i?C.primary:C.sub,
              fontWeight: tab===i?700:500, fontSize:11, cursor:"pointer",
              boxShadow: tab===i?"0 2px 8px rgba(37,99,235,.12)":"none",
              transition:"all .2s", fontFamily:"inherit"
            }}>{t.icon}<br/>{t.label}</button>
          ))}
        </div>

        {tab===0 && <VisitTab data={data} setData={setData} toast={toast} />}
        {tab===1 && <OrderTab data={data} setData={setData} toast={toast} />}
        {tab===2 && <DeliveryTab data={data} setData={setData} toast={toast} />}
        {tab===3 && <ReportTab data={data} />}
        {tab===4 && <ChatTab data={data} setData={setData} myName={myName} toast={toast} />}
      </div>

      <Toast msg={toastMsg} />
    </div>
  );
}