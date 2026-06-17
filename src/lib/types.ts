// ─────────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────────

export type VisitStatus = "予定" | "訪問済" | "見込み" | "失注";
export type OrderStatus = "受注" | "準備中" | "出荷待ち" | "納品済";

export interface Visit {
  id: string;
  date: string;
  client: string;
  address: string;
  memo: string;
  status: VisitStatus;
}

export interface Order {
  id: string;
  visitId: string;
  client: string;
  item: string;
  qty: string;
  price: string;
  orderedAt: string;
  status: OrderStatus;
}

export interface Delivery {
  id: string;
  orderId: string;
  deliveredAt: string;
  memo: string;
  client: string;
  item: string;
  qty: string;
}

export interface Comment {
  id: string;
  targetId: string;
  author: string;
  text: string;
  at: string;
}

export interface Message {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface AppData {
  visits: Visit[];
  orders: Order[];
  deliveries: Delivery[];
  comments: Comment[];
  messages: Message[];
}

export const EMPTY_STATE: AppData = {
  visits: [],
  orders: [],
  deliveries: [],
  comments: [],
  messages: [],
};

// Shared component prop helpers
export type SetData = (updater: AppData | ((prev: AppData) => AppData)) => void;
export type Toast = (msg: string) => void;
