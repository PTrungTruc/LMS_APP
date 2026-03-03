import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.SERVER_PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

// Vì ES module không có __dirname nên phải tự tạo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");

// Danh sách store hợp lệ
const ALLOWED_STORES = [
  "users",
  "lop",
  "giangVien",
  "hocVien",
  "diemDanh",
  "baiTap"
];

// Nếu folder chưa có → tạo
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("📁 Đã tạo folder data");
}

// API Sync
app.post("/sync/:store", (req, res) => {
  const store = req.params.store;

  if (!ALLOWED_STORES.includes(store)) {
    return res.status(400).json({ error: "Store không hợp lệ" });
  }

  const filePath = path.join(DATA_DIR, `${store}.json`);

  try {
    // Nếu file chưa tồn tại → tạo file rỗng trước
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
      console.log(`📄 Đã tạo file ${store}.json`);
    }

    // Ghi dữ liệu mới
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));

    res.json({ message: `${store} synced successfully` });
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
    res.status(500).json({ error: "Không thể ghi file" });
  }
});

// API đọc dữ liệu từ file JSON
app.get("/data/:store", (req, res) => {
  const store = req.params.store;

  const filePath = path.join(DATA_DIR, `${store}.json`);

  if (!fs.existsSync(filePath)) {
    return res.json([]); // nếu chưa có file thì trả về mảng rỗng
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    console.error("Lỗi đọc file:", err);
    res.status(500).json({ error: "Không thể đọc file" });
  }
});


// 5️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});