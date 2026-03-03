import { openDB } from 'idb';
import { restoreFromJson } from "../utils/syncToJson";

const DB_NAME = 'LMS_TOPIK_SYSTEM';
const DB_VERSION = 1;

// Hàm tạo dữ liệu mẫu (Chỉ chạy 1 lần khi máy chưa có gì)
const seedDatabase = async (db) => {
  const tx = db.transaction(['users', 'giangVien', 'lop'], 'readwrite');
  
  await tx.objectStore('users').add({ email: 'admin@topik.com', password: '123', role: 'ADMIN', name: 'Admin Tổng' });
  await tx.objectStore('users').add({ email: 'gv@topik.com', password: '123', role: 'GV', maGV: 'GV01', name: 'Cô giáo Kim' });
  await tx.objectStore('giangVien').add({ maGV: 'GV01', tenGV: 'Cô giáo Kim' });
  await tx.objectStore('lop').add({ maLop: 'TOPIK-II', tenLop: 'Lớp Sơ Cấp 2', maGV: 'GV01' });

  // Tạo sẵn 1 học viên để test
  await tx.objectStore('users').add({ email: 'hv@topik.com', password: '123', role: 'HV', maHV: 'HV01', name: 'Park Hang Seo', maLop: 'TOPIK-II' });

  await tx.done;
};

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        store.createIndex('email', 'email', { unique: true });
      }
      if (!db.objectStoreNames.contains('giangVien')) {
        db.createObjectStore('giangVien', { keyPath: 'maGV' });
      }
      if (!db.objectStoreNames.contains('lop')) {
        db.createObjectStore('lop', { keyPath: 'maLop' });
      }
      if (!db.objectStoreNames.contains('hocVien')) {
        const store = db.createObjectStore('hocVien', { keyPath: 'maHV' });
        store.createIndex('maLop', 'maLop');
      }
      if (!db.objectStoreNames.contains('diemDanh')) {
        const store = db.createObjectStore('diemDanh', { keyPath: 'id', autoIncrement: true });
        store.createIndex('maHV', 'maHV');
        // Tạo index kép để tìm nhanh: điểm danh của HV ngày hôm đó
        store.createIndex('maHV_ngay', ['maHV', 'ngay'], { unique: true }); 
      }
      if (!db.objectStoreNames.contains('baiTap')) {
        const store = db.createObjectStore('baiTap', { keyPath: 'id', autoIncrement: true });
        store.createIndex('maHV', 'maHV');
      }
    },
  });
};

export const getDB = async () => {
  const db = await initDB();
  const count = await db.count('users');

  if (count === 0) {
    // await seedDatabase(db);
    await restoreFromJson(db);   // truyền db vào
    window.location.reload();
  }

  return db;
};