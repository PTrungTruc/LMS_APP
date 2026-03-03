import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDB } from '../../db/db';
import { syncAllStores } from "../../utils/syncToJson";
import { exportToCSV } from '../../utils/exportUtils';
import {
  Users, UserPlus, Trash2, Eye, AlertTriangle,
  BookOpen, GraduationCap, ArrowLeft, X, Edit,
  UserCheck, Search, Filter, Plus, Save
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Data Global
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);

  // States Drill-down (Soi chi tiết)
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [historyType, setHistoryType] = useState("GRADE");  // "GRADE" | "ATTENDANCE" | null

  // States Modal (Popup)
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false); // ✨ MỚI: Modal thêm lớp 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Form Data
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'HV', maLop: '' });
  const [newClass, setNewClass] = useState({ maLop: '', tenLop: '' }); // ✨ MỚI: Form lớp
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [assignData, setAssignData] = useState({ classToEdit: null });
  const [uploadFile, setUploadFile] = useState(null);

  // 1. SYNC URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/classes')) setActiveTab('CLASSES');
    else if (path.includes('/admin/users')) setActiveTab('USERS');
    else if (path.includes('/admin/backup')) { setActiveTab('OVERVIEW'); setShowBackupModal(true); }
    else setActiveTab('OVERVIEW');
  }, [location]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const db = await getDB();
    await syncAllStores();
    const [u, c, a, g] = await Promise.all([
      db.getAll('users'), db.getAll('lop'), db.getAll('diemDanh'), db.getAll('baiTap')
    ]);
    const roleOrder = { ADMIN: 1, GV: 2, HV: 3 }; const sortedUsers = u.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));
    setUsers(sortedUsers); setClasses(c); setAttendance(a); setGrades(g);
    setLoading(false);
  };

  // --- LOGIC: THÊM LỚP MỚI (✨ TÍNH NĂNG MỚI) ---
  const handleAddTeacher = (maGV) => {
    if (!maGV) return;

    // Không cho thêm trùng
    if (selectedTeachers.find(t => t.maGV === maGV)) return;

    const teacher = users.find(u => u.maGV === maGV);

    if (teacher) {
      setSelectedTeachers(prev => [...prev, teacher]);
    }
  };

  const handleRemoveTeacher = (maGV) => {
    setSelectedTeachers(prev =>
      prev.filter(t => t.maGV !== maGV)
    );
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.maLop || !newClass.tenLop) return alert("Vui lòng nhập Mã lớp và Tên lớp!");

    const db = await getDB();

    // Check trùng mã lớp (Optional but good)
    const exist = await db.get('lop', newClass.maLop);
    if (exist) return alert("Mã lớp này đã tồn tại!");

    const tx = db.transaction('lop', 'readwrite');
    const store = tx.objectStore('lop');

    const maGVString = selectedTeachers.map(gv => gv.maGV).join(',');

    await store.add({
      maLop: newClass.maLop,
      tenLop: newClass.tenLop,
      maGV: maGVString // lưu dạng: "GV01,GV02,GV03"
    });

    await tx.done;

    setShowClassModal(false);
    setNewClass({ maLop: '', tenLop: '' });
    setSelectedTeachers([]);
    loadData();
  };

  // --- LOGIC CŨ ---
  const getStudentStats = (maHV) => {
    const myAtt = attendance.filter(x => x.maHV === maHV);
    const present = myAtt.filter(x => x.coMat).length;
    const total = myAtt.length;
    const pct = total ? Math.round((present / total) * 100) : 100;

    const myGrades = grades.filter(x => x.maHV === maHV);
    const avg = myGrades.length ? (myGrades.reduce((sum, item) => sum + parseFloat(item.diem), 0) / myGrades.length).toFixed(1) : 0;
    return { pct, avg, absentCount: total - present, history: myAtt, gradeList: myGrades, attendanceList: myAtt };
  };

  const handleAssignGV = async () => {
    if (!assignData.classToEdit) return;
    const db = await getDB();
    const maGVString = selectedTeachers.map(gv => gv.maGV).join(',');
    await db.put('lop', { ...assignData.classToEdit, maGV: maGVString });

    setShowAssignModal(false);
    setSelectedTeachers([]);
    loadData();
  };

  // Chưa sửa logic thêm vào bảng hocvien và giangvien
  const handleAddUser = async (e) => {
    e.preventDefault();
    const db = await getDB();
    const suffix = Math.floor(Math.random() * 9999);
    let extra = {};
    if (newUser.role === 'GV') extra = { maGV: `GV${suffix}` };
    if (newUser.role === 'HV') extra = { maHV: `HV${suffix}`, maLop: newUser.maLop || 'TOPIK-K1' };

    await db.add('users', { ...newUser, ...extra });
    setShowUserModal(false); loadData(); alert('Thêm User thành công!');
  };

  const handleUploadUsers = async () => {
    if (!uploadFile) return alert("Vui lòng chọn file CSV");
    const text = await uploadFile.text();
    const rows = text.split('\n').slice(1);
    const db = await getDB();
    const tx = db.transaction(['users', 'giangVien', 'hocVien'], 'readwrite');
    const userStore = tx.objectStore('users');
    const gvStore = tx.objectStore('giangVien');
    const hvStore = tx.objectStore('hocVien');
    let success = 0; let fail = 0;

    for (let row of rows) {
      if (!row.trim()) continue;
      const [name, email, password, role, maLop] = row.split(',');
      if (!name || !email || !password || !role) {
        fail++;
        continue;
      }
      const suffix = Math.floor(Math.random() * 9999);
      let extra = {};

      try {
        // ================= HV =================
        if (role.trim() === 'HV') {
          if (!maLop) {
            fail++;
            continue;
          }
          extra = {
            maHV: `HV${suffix}`,
            maLop: maLop.trim()
          };
          await userStore.add({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            role: role.trim(),
            ...extra
          });
          await hvStore.add({
            tenHV: name.trim(),
            ...extra
          });
          success++;
        }

        // ================= GV =================
        else if (role.trim() === 'GV') {
          const maGV = `GV${suffix}`;
          // Add vào users
          await userStore.add({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            role: role.trim(),
            maGV
          });

          // Add vào giangVien
          await gvStore.add({
            maGV,
            tenGV: name.trim()
          });
          success++;
        }

        else {
          fail++;
        }
      } catch (err) {
        console.error("Lỗi khi thêm:", err);
        fail++;
      }
    }
    await tx.done;

    alert(`Upload hoàn tất!\nThành công: ${success}\nThất bại: ${fail}`);
    setShowUploadModal(false);
    setUploadFile(null);
    loadData();
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Xóa vĩnh viễn user này?')) {
      const db = await getDB();
      const user = await db.get('users', id);
      if (!user) return;
      if (user.role === "HV" && user.maHV) {
        await db.delete('hocVien', user.maHV);
        // Xóa dữ liệu data điểm danh và bài tập
        const maHV = user.maHV; const tx = db.transaction(['baiTap', 'diemDanh'], 'readwrite'); const baiTapStore = tx.objectStore('baiTap'); const diemDanhStore = tx.objectStore('diemDanh'); const allBaiTap = await baiTapStore.getAll(); for (const bt of allBaiTap) { if (bt.maHV === maHV) { await baiTapStore.delete(bt.id); } } const allDiemDanh = await diemDanhStore.getAll(); for (const dd of allDiemDanh) { if (dd.maHV === maHV) { await diemDanhStore.delete(dd.id); } } await tx.done;
      }
      else if (user.role === "GV" && user.maGV) {
        await db.delete('giangVien', user.maGV);
        const maGV = user.maGV;
        // Xóa maGV trong lop
        const classes = await db.getAll('lop'); const tx = db.transaction('lop', 'readwrite'); const store = tx.objectStore('lop'); for (const cls of classes) { if (!cls.maGV) continue; const gvList = cls.maGV.split(',').map(id => id.trim()).filter(id => id !== maGV); const newMaGV = gvList.length ? gvList.join(',') : ''; if (newMaGV !== cls.maGV) { await store.put({ ...cls, maGV: newMaGV }); } } await tx.done;
      }
      await db.delete('users', id);
      loadData();
    }
  };

  // MODAL BACKUP
  const handleCloseBackup = () => {
    setShowBackupModal(false);
    navigate('/admin');
  };
  const handleExportBackup = async () => {
    const db = await getDB();

    const storeNames = db.objectStoreNames;
    const workbook = XLSX.utils.book_new();

    for (let i = 0; i < storeNames.length; i++) {
      const storeName = storeNames[i];
      const data = await db.getAll(storeName);

      if (!data || data.length === 0) continue;

      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, storeName);
    }

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, `backup_${Date.now()}.xlsx`);
  };

  const handleImportBackup = async (file) => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const db = await getDB();
    const tx = db.transaction(["users", "lop", "giangVien", "baiTap", "diemDanh"], "readwrite");
    let success = 0;
    let fail = 0;

    // ================= VALIDATE HELPERS =================
    const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    const isValidScore = (n) => !isNaN(n) && n >= 0 && n <= 10;
    const parseBoolean = (v) => v === true || v === "true";

    try {

      // ================= USERS =================
      if (workbook.Sheets["users"]) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets["users"]);
        for (let row of rows) {
          try {
            if (!row.email) { fail++; continue; }
            const existing = await tx.objectStore("users")
              .index("email")
              .get(row.email);
            const userData = {
              id: row.id || undefined,
              email: row.email,
              password: row.password || "",
              role: row.role || "",
              name: row.name || "",
              maGV: row.maGV || "",
              maHV: row.maHV || "",
              maLop: row.maLop || ""
            };

            if (existing) {
              await tx.objectStore("users").put({ ...existing, ...userData });
            } else {
              await tx.objectStore("users").add(userData);
            }
            success++;
          } catch {
            fail++;
          }
        }
      }

      // ================= LOP =================
      if (workbook.Sheets["lop"]) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets["lop"]);

        for (let row of rows) {
          if (!row.maLop) { fail++; continue; }
          const store = tx.objectStore("lop");
          const existing = await store.get(row.maLop);

          if (existing) {
            await store.put({ ...existing, ...row });
          } else {
            await store.add(row);
          }
          success++;
        }
      }

      // ================= GIANG VIEN =================
      if (workbook.Sheets["giangVien"]) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets["giangVien"]);

        for (let row of rows) {
          if (!row.maGV) { fail++; continue; }
          const store = tx.objectStore("giangVien");
          const existing = await store.get(row.maGV);

          if (existing) {
            await store.put(row);
          } else {
            await store.add(row);
          }
          success++;
        }
      }

      // ================= BAI TAP =================
      if (workbook.Sheets["baiTap"]) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets["baiTap"]);

        for (let row of rows) {
          if (!row.maHV || !row.maLop || !row.tenBai) {
            fail++; continue;
          }
          if (!isValidScore(row.diem)) {
            fail++; continue;
          }
          if (!isValidDate(row.ngay)) {
            fail++; continue;
          }
          const store = tx.objectStore("baiTap");
          if (row.id) {
            const existing = await store.get(row.id);
            if (existing) {
              await store.put({ ...existing, ...row });
            } else {
              await store.add(row);
            }
          } else {
            await store.add(row);
          }

          success++;
        }
      }

      // ================= DIEM DANH =================
      if (workbook.Sheets["diemDanh"]) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets["diemDanh"]);

        for (let row of rows) {
          if (!row.maHV || !row.maLop || !row.ngay) {
            fail++; continue;
          }

          if (!isValidDate(row.ngay)) {
            fail++; continue;
          }

          row.coMat = parseBoolean(row.coMat);

          const store = tx.objectStore("diemDanh");

          if (row.id) {
            const existing = await store.get(row.id);
            if (existing) {
              await store.put({ ...existing, ...row });
            } else {
              await store.add(row);
            }
          } else {
            await store.add(row);
          }

          success++;
        }
      }
      await tx.done;
      alert(`Import hoàn tất!\nThành công: ${success}\nBỏ qua: ${fail}`);
      loadData();

    } catch (err) {
      console.error(err);
      alert("Import thất bại!");
    }
  };


  // --- TABS COMPONENTS ---
  const OverviewTab = () => {
    const warningList = users.filter(u => u.role === 'HV').map(u => ({ ...u, stats: getStudentStats(u.maHV) }))
      .filter(u => u.stats.pct < 90 || u.stats.avg < 5.0);
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Học Viên', val: users.filter(u => u.role === 'HV').length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Giảng Viên', val: users.filter(u => u.role === 'GV').length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Lớp Học', val: classes.length, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Cảnh Báo Đỏ', val: warningList.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((item, idx) => (
            <div key={idx} className="overflow-y-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start">
                <div><p className="text-slate-500 font-medium text-sm mb-1">{item.label}</p><h3 className="text-4xl font-extrabold text-slate-800">{item.val}</h3></div>
                <div className={`ml-1 p-4 rounded-2xl ${item.bg} ${item.color}`}><item.icon size={24} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={20} /></div><h3 className="font-bold text-xl text-slate-800">Cần theo dõi đặc biệt</h3></div>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold"><tr><th className="p-4">Học Viên</th><th className="p-4">Lớp</th><th className="p-4">Chuyên Cần</th><th className="p-4">Điểm TB</th><th className="p-4 text-center">Hành động</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {warningList.length > 0 ? warningList.map(u => (
                  <tr key={u.id} className="hover:bg-red-50/30 transition"><td className="p-4 font-bold text-slate-700">{u.name}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{u.maLop}</span></td><td className="p-4 font-bold text-red-500">{u.stats.pct}%</td><td className="p-4 font-bold text-red-500">{u.stats.avg}</td><td className="p-4 text-center"><button onClick={() => setSelectedStudent(u)} className="text-blue-600 font-bold text-sm hover:underline">Chi tiết</button></td></tr>
                )) : <tr><td colSpan="5" className="p-8 text-center text-slate-400">Không có cảnh báo nào. Tuyệt vời!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ClassesTab = () => {
    // VIEW 1: CHI TIẾT LỚP
    if (selectedClass) {
      const classStudents = users.filter(u => u.role === 'HV' && u.maLop === selectedClass.maLop);
      return (
        <div className="animate-fade-in">
          <button onClick={() => setSelectedClass(null)} className="mb-4 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition"><ArrowLeft size={20} /> Quay lại danh sách</button>
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-extrabold text-slate-800">{selectedClass.tenLop}</h2><div className="text-right"><p className="text-sm text-slate-400 font-bold uppercase">Giảng viên</p><p className="text-lg font-bold text-blue-600">{selectedClass.maGV ? selectedClass.maGV.split(',').map(id => users.find(u => u.maGV === id)?.name).filter(Boolean).join(', ') : 'Chưa có GV'}</p></div></div>
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500"><tr><th className="p-4">Mã HV</th><th className="p-4">Tên</th><th className="p-4">Chuyên cần</th><th className="p-4 text-center">Soi chi tiết</th></tr></thead><tbody className="divide-y divide-slate-100">{classStudents.map(s => { const stats = getStudentStats(s.maHV); return (<tr key={s.id} className="hover:bg-slate-50 transition"><td className="p-4 font-mono text-slate-500">{s.maHV}</td><td className="p-4 font-bold text-slate-700">{s.name}</td><td className={`p-4 font-bold ${stats.pct < 90 ? 'text-red-500' : 'text-green-500'}`}>{stats.pct}%</td><td className="p-4 text-center"><button onClick={() => setSelectedStudent(s)} className="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-100"><Eye size={18} /></button></td></tr>) })}</tbody></table>
            </div>
          </div>
        </div>
      );
    }
    // VIEW 2: DANH SÁCH LỚP
    return (
      <div className="animate-fade-in space-y-8">
        {/* Header có nút Thêm Lớp */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 ml-2">Danh sách lớp học</h3>
          <button onClick={() => { setNewClass({ maLop: '', tenLop: '' }); setSelectedTeachers([]); setShowClassModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition flex items-center gap-2">
            <Plus size={20} /> Thêm Lớp Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(c => (
            <div key={c.maLop} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer" onClick={() => setSelectedClass(c)}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition"><BookOpen size={24} /></div>
                <button onClick={(e) => { e.stopPropagation(); const teacherIds = c.maGV ? c.maGV.split(',').map(id => id.trim()) : []; const teacherObjects = users.filter(u => u.role === 'GV' && teacherIds.includes(u.maGV)); setSelectedTeachers(teacherObjects); setAssignData({ classToEdit: c }); setShowAssignModal(true); }} className="text-xs font-bold bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"><UserCheck size={14} /> GV</button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{c.tenLop}</h3>
              <p className="text-sm text-slate-500 mb-4"> GV: {c.maGV ? c.maGV.split(',').map(id => users.find(u => u.maGV === id)?.name).filter(Boolean).join(', ') : 'Trống'} </p>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Sĩ số: {users.filter(u => u.maLop === c.maLop).length}</span><span className="text-blue-600 font-bold text-sm">Vào lớp &rarr;</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const UsersTab = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">Danh sách tài khoản</h3><button onClick={() => setShowUserModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition flex items-center gap-2"><UserPlus size={18} /> Thêm Mới</button></div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500"><tr><th className="p-4">Role</th><th className="p-4">Họ Tên</th><th className="p-4">Email</th><th className="p-4 text-right">Hành động</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{users.map(u => (<tr key={u.id} className="hover:bg-slate-50 transition"><td className="p-4"><span className={`px-3 py-1 rounded-lg text-xs font-extrabold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : u.role === 'GV' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>{u.role}</span></td><td className="p-4 font-bold text-slate-700">{u.name}</td><td className="p-4 text-slate-500">{u.email}</td><td className="p-4 text-right flex justify-end gap-2">{u.role === 'HV' && <button onClick={() => setSelectedStudent(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Eye size={18} /></button>}<button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={18} /></button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div><h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Trung Tâm Điều Hành</h1><p className="font-medium text-slate-500 text-sm md:text-md">Quản lý hệ thống đào tạo TOPIK</p></div>
        </div>

        {activeTab === 'OVERVIEW' && loadData && <OverviewTab />}
        {activeTab === 'CLASSES' && loadData && <ClassesTab />}
        {activeTab === 'USERS' && loadData && <UsersTab />}

      </div>
      {/* --- MODAL THÊM LỚP (NEW) --- */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-700">Tạo Lớp Học Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã Lớp (VD: TOPIK-K2)</label>
                <input className="w-full border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="Mã lớp..." value={newClass.maLop} onChange={e => setNewClass({ ...newClass, maLop: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên Lớp</label>
                <input className="w-full border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="Tên lớp hiển thị..." value={newClass.tenLop} onChange={e => setNewClass({ ...newClass, tenLop: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1"> Phân công GV (Tuỳ chọn) </label>

                <select
                  className="w-full border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-500"
                  onChange={(e) => {
                    handleAddTeacher(e.target.value);
                    e.target.value = ""; // reset select
                  }}
                >
                  <option value="">-- Thêm giáo viên --</option>
                  {users.filter(u => u.role === 'GV').map(g => (<option key={g.maGV} value={g.maGV}> {g.maGV} - {g.name} </option>))}
                </select>

                {/* CARD HIỂN THỊ GV ĐÃ CHỌN */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTeachers.map(gv => (
                    <div
                      key={gv.maGV}
                      className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl font-bold text-sm"
                    >
                      <span>{gv.maGV} - {gv.name}</span>
                      <button
                        onClick={() => handleRemoveTeacher(gv.maGV)}
                        className="text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleAddClass} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex justify-center gap-2 mt-2"><Plus size={20} /> Tạo Lớp</button>
              <button onClick={() => { setShowClassModal(false); setSelectedTeachers([]); setNewClass({ maLop: '', tenLop: '' }); }} className="w-full text-slate-500 font-bold py-2">Hủy</button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL PHÂN CÔNG GV */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-6">Phân công Giảng Viên</h3>
            <p className="text-sm text-gray-500 mb-4">Lớp: <span className="font-bold text-black">{assignData.classToEdit?.tenLop}</span></p>
            <select
              className="w-full border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-blue-500"
              onChange={(e) => {
                handleAddTeacher(e.target.value);
                e.target.value = "";
              }}>
              <option value="">-- Thêm giáo viên --</option>
              {users.filter(u => u.role === 'GV').map(gv => (<option key={gv.maGV} value={gv.maGV}> {gv.maGV} - {gv.name} </option>))}
            </select>

            <div className="flex flex-wrap gap-2 my-3">
              {selectedTeachers.map(gv => (
                <div key={gv.maGV} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-xl font-bold text-sm">
                  <span>{gv.maGV} - {gv.name}</span>
                  <button onClick={() => handleRemoveTeacher(gv.maGV)} className="text-red-500 font-bold" > ✕ </button>
                </div>
              ))}
            </div>
            <button onClick={handleAssignGV} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-3 hover:bg-blue-700">Lưu Thay Đổi</button>
            <button onClick={() => { setShowAssignModal(false); setSelectedTeachers([]); }} className="w-full text-slate-500 font-bold py-2" > Hủy </button>
          </div>
        </div>
      )}

      {/* MODAL SOI CHI TIẾT HV */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in">

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                <p className="text-slate-500 font-bold">{selectedStudent.maHV}</p>
              </div>
              <button onClick={() => { setSelectedStudent(null); setHistoryType(null); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-6 rounded-2xl text-center">
                <p className="text-blue-500 font-bold uppercase text-xs mb-1">Điểm TB</p>
                <p className="text-4xl font-extrabold text-blue-700">
                  {getStudentStats(selectedStudent.maHV).avg}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl text-center">
                <p className="text-green-500 font-bold uppercase text-xs mb-1">Chuyên cần</p>
                <p className="text-4xl font-extrabold text-green-700">
                  {getStudentStats(selectedStudent.maHV).pct}%
                </p>
              </div>
            </div>

            {/* TOGGLE BUTTONS */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setHistoryType(historyType === "GRADE" ? null : "GRADE")}
                className={`px-4 py-2 rounded-xl font-bold ${historyType === "GRADE"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Lịch sử bài làm
              </button>

              <button
                onClick={() => setHistoryType(historyType === "ATTENDANCE" ? null : "ATTENDANCE")}
                className={`px-4 py-2 rounded-xl font-bold ${historyType === "ATTENDANCE"
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Lịch sử điểm danh
              </button>
            </div>

            {/* ================= GRADE HISTORY ================= */}
            {historyType === "GRADE" && (
              <>
                <h3 className="font-bold text-lg mb-4 text-slate-700">Lịch sử bài làm</h3>
                <div className="border rounded-xl overflow-hidden mb-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3">Bài</th>
                        <th className="p-3">Ngày</th>
                        <th className="p-3">Điểm</th>
                        <th className="p-3 text-center">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStudentStats(selectedStudent.maHV).gradeList.map((g, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3 font-bold">{g.tenBai}</td>
                          <td className="p-3 font-bold">{g.ngay}</td>
                          <td className="p-3 font-bold text-blue-600">{g.diem}</td>
                          <td className="p-3 text-slate-500 italic text-center">{g.nhanXet || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ================= ATTENDANCE HISTORY ================= */}
            {historyType === "ATTENDANCE" && (
              <>
                <h3 className="font-bold text-lg mb-4 text-slate-700">Lịch sử điểm danh</h3>
                <div className="border rounded-xl overflow-hidden mb-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3">Ngày</th>
                        <th className="p-3 text-center">Trạng thái</th>
                        <th className="p-3 text-center">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStudentStats(selectedStudent.maHV).attendanceList.map((a, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3 font-medium">{a.ngay}</td>
                          <td className={`p-3 text-center font-bold ${a.coMat ? "text-green-600" : "text-red-500"}`}>
                            {a.coMat ? "Có mặt" : "Vắng"}
                          </td>
                          <td className="p-3 text-slate-500 italic text-center">{a.nhanXet ? `"${a.nhanXet}" - Bởi ${users.find(u => u.maGV === a.maGV)?.name || "Không rõ"}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADD USER */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"> Thêm User Mới </h3>
              <span onClick={() => { setShowUploadModal(true); setShowUserModal(false); }}
                className="text-xs text-slate-500 underline cursor-pointer hover:text-blue-700 font-semibold transition"
              > Upload danh sách bằng file CSV </span>
            </div>

            <div className="space-y-4">
              <input className="w-full border p-3 rounded-xl font-medium outline-none focus:ring-2 ring-blue-500" placeholder="Họ tên" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <input className="w-full border p-3 rounded-xl font-medium outline-none focus:ring-2 ring-blue-500" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              <input className="w-full border p-3 rounded-xl font-medium outline-none focus:ring-2 ring-blue-500" placeholder="Mật khẩu" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              <select className="w-full border p-3 rounded-xl font-bold" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="HV">Học Viên</option><option value="GV">Giảng Viên</option><option value="ADMIN">Admin</option>
              </select>
              {newUser.role === 'HV' && (<select className="w-full border p-3 rounded-xl font-bold" value={newUser.maLop} onChange={e => setNewUser({ ...newUser, maLop: e.target.value })}><option value="">-- Chọn Lớp --</option>{classes.map(c => <option key={c.maLop} value={c.maLop}>{c.tenLop}</option>)}</select>)}
              <button onClick={handleAddUser} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Tạo tài khoản</button>
              <button onClick={() => setShowUserModal(false)} className="w-full text-slate-500 font-bold py-2">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD STUDENT */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-blue-700"> Upload Danh Sách User </h3>
            <div className="space-y-4">
              <input type="file" accept=".csv"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full border-2 border-slate-200 p-3 rounded-xl font-medium" />

              <p className="text-xs text-slate-400"> Format CSV: name,email,password,role,maLop </p>
              <button onClick={handleUploadUsers} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700" > Upload </button>
              <button onClick={() => setShowUploadModal(false)} className="w-full text-slate-500 font-bold py-2" > Hủy </button>

            </div>
          </div>
        </div>
      )}

      {/* MODAL BACKUP DATABASE */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-700">
              Sao lưu & Khôi phục dữ liệu
            </h3>

            <div className="space-y-4">
              <button onClick={handleExportBackup} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700" > Export toàn bộ dữ liệu </button>
              <label className="w-full bg-gray-300 hover:bg-gray-400 text-gray-600 py-3 rounded-xl font-bold cursor-pointer flex items-center justify-center"> Import <input type="file" accept=".xlsx" className="hidden" onChange={(e) => handleImportBackup(e.target.files[0])} /> </label>

              <button onClick={handleCloseBackup} className="w-full text-slate-500 font-bold py-2" > Đóng </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}