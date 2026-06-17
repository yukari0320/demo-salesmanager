import { promises as fs } from "fs";
import path from "path";
import { EMPTY_STATE, type AppData } from "./types";

// Server-side persistence: a single JSON file under /data.
// This replaces the original `window.storage` key-value store and
// lets multiple devices share the same data set.

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readStore(): Promise<AppData> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge with EMPTY_STATE so missing keys (e.g. older files) stay valid.
    return { ...EMPTY_STATE, ...parsed };
  } catch {
    return EMPTY_STATE;
  }
}

export async function writeStore(data: AppData): Promise<void> {
  await ensureDir();
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}
