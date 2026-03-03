import { getDB } from "../db/db";

export const syncAllStores = async () => {
  const db = await getDB();

  const stores = [
    "users",
    "lop",
    "giangVien",
    "hocVien",
    "diemDanh",
    "baiTap"
  ];

  for (let store of stores) {
    const data = await db.getAll(store);

    await fetch(`http://localhost:5000/sync/${store}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  }
};

export const restoreFromJson = async (db) => {
  const stores = [
    "users",
    "lop",
    "giangVien",
    "hocVien",
    "diemDanh",
    "baiTap"
  ];

  for (let store of stores) {
    const res = await fetch(`http://localhost:5000/data/${store}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) continue;

    const tx = db.transaction(store, "readwrite");
    const objectStore = tx.objectStore(store);

    for (let item of data) {
      try {
        await objectStore.put(item);
      } catch (err) {
        console.warn(`Lỗi restore ${store}:`, err);
      }
    }

    await tx.done;
  }

  console.log("✅ Restore từ JSON hoàn tất");
};