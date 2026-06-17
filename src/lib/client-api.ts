import { EMPTY_STATE, type AppData } from "./types";

// Client-side data access. Replaces the original window.storage helpers
// with calls to the Next.js API route (/api/data).

export async function loadData(): Promise<AppData> {
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (!res.ok) return EMPTY_STATE;
    const data = (await res.json()) as Partial<AppData>;
    return { ...EMPTY_STATE, ...data };
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error(e);
  }
}
