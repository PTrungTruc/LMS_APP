import { openDB } from 'idb';

const DB_NAME = 'LMS_Local_DB';
const DB_VERSION = 1;

// Hàm tạo dữ liệu mẫu (Seed)
const seedDatabase = async (db) => {
  const tx = db.transaction(['users', 'giangVien', 'hocVien', 'lop', 'diemDanh', 'baiTap'], 'readwrite');
  
  // 1. Tạo Admin
  await tx.objectStore('users').add({
    email: 'admin@lms.com', password: '123', role: 'ADMIN', name: 'Super Admin'
  });

  // 2. Tạo GV
  await tx.objectStore('users').add({
    email: 'gv@lms.com', password: '123', role: 'GV', maGV: 'GV01', name: 'Thầy Ba'
  });
  await tx.objectStore('giangVien').add({ maGV: 'GV01', tenGV: 'Thầy Ba' });

  // 3. Tạo Lớp
  await tx.objectStore('lop').add({ maLop: 'REACT01', tenLop: 'React Master', maGV: 'GV01' });

  // 4. Tạo Học Viên
  await tx.objectStore('users').add({
    email: 'hv@lms.com', password: '123', role: 'HV', maHV: 'HV01', name: 'Nguyễn Văn A'
  });
  await tx.objectStore('hocVien').add({ maHV: 'HV01', tenHV: 'Nguyễn Văn A', maLop: 'REACT01' });

  await tx.done;
  console.log("Seeding data complete...");
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
    await seedDatabase(db);
    // Reload lại trang để nhận user vừa seed nếu cần
    console.log("Database initialized with seed data.");
  }
  return db;
};