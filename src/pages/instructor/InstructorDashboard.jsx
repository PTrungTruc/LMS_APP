import React, { useEffect, useState } from 'react';
import { getDB } from '../../db/db';
import { syncAllStores } from "../../utils/syncToJson";
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle, XCircle, Save, Calendar, Users, Search, MessageSquare,
  X, Check, FileText, ClipboardList, ArrowLeft
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ================= TOAST ================= */
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-500 hover:scale-105 ${toast.type === 'success'
          ? 'bg-white border-l-4 border-green-500'
          : 'bg-white border-l-4 border-red-500'
          }`}
      >
        <div
          className={`p-1 rounded-full ${toast.type === 'success'
            ? 'bg-green-100 text-green-600'
            : 'bg-red-100 text-red-600'
            }`}
        >
          {toast.type === 'success' ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <X size={16} strokeWidth={3} />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-sm">{toast.title}</h4>
          <p className="text-xs text-slate-500">{toast.message}</p>
        </div>

        <button onClick={() => removeToast(toast.id)}>
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// ================= SIDE TABS COMPONENTS =================
function DetailTab({ myClass, myClasses, selectedClassId, setSelectedClassId, activeTab, setActiveTab, students, attendanceDate, setAttendanceDate, attendanceNotes, setAttendanceNotes, handleAttendance, handleSaveAllAttendance, exams, openCreateModal, openEditModal, handleDeleteExam, studentSearch, setStudentSearch, examSearch, setExamSearch, filteredStudents, filteredExams }) {
  return (
    <>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {myClass.tenLop}
          </h1>
          <div className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Users size={16} />
            Mã lớp:
            <div className="relative">
              {myClasses.length > 1 ? (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-xs cursor-pointer outline-none"
                >
                  {myClasses.map((cls) => (
                    <option key={cls.maLop} value={cls.maLop}>
                      {cls.maLop}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-xs">
                  {myClass.maLop}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
          {['ATTENDANCE', 'EXAMS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              {tab === 'ATTENDANCE' ? (
                <>
                  <ClipboardList size={18} /> Điểm Danh
                </>
              ) : (
                <>
                  <FileText size={18} /> Bài Thi
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white mt-8 rounded-3xl shadow-sm border border-slate-100 p-6 min-h-[600px] overflow-y-auto">

        {/* ================= ATTENDANCE ================= */}
        {activeTab === 'ATTENDANCE' && (
          <>
            <div className="text-xs font-medium mb-5"> *Lưu ý: Chỉ khi nhấn các mục 'Trạng thái' mới thực sự lưu nhận xét </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <Calendar size={18} />
                  <input
                    type="date"
                    className="bg-transparent font-bold text-slate-700 outline-none"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>

                {/* NÚT LƯU */}
                <button
                  onClick={handleSaveAllAttendance}
                  className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-green-700 flex items-center gap-2"
                > <Save size={18} /> Lưu </button>
              </div>

              {/* SEARCH STUDENT */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  name="studentSearch"
                  placeholder="Tìm học viên theo tên hoặc mã..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500">
                  <tr>
                    <th className="p-5">Học Viên</th>
                    <th className="p-5 w-1/3">Nhận xét</th>
                    <th className="p-5 text-center w-1/4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.maHV} className="hover:bg-slate-50 transition">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{s.maHV}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="relative">
                          <MessageSquare size={16} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            className="attendanceNotes w-full pl-9 pr-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                            value={attendanceNotes[s.maHV] || ''}
                            placeholder='VD: Đi trễ'
                            onChange={(e) =>
                              setAttendanceNotes({
                                ...attendanceNotes,
                                [s.maHV]: e.target.value
                              })
                            }
                          />
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleAttendance(s, true)}
                            className={`px-4 py-2 rounded-xl border font-bold ${s.isPresent === true
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-500'
                              }`}
                          >
                            Có mặt
                          </button>

                          <button
                            onClick={() => handleAttendance(s, false)}
                            className={`px-4 py-2 rounded-xl border font-bold ${s.isPresent === false
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500'
                              }`}
                          >
                            Vắng
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= EXAMS ================= */}
        {activeTab === 'EXAMS' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <button onClick={openCreateModal} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700">  + Tạo bài thi </button>

              {/* SEARCH EXAM */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  name="examSearch"
                  placeholder="Tìm theo tên bài thi hoặc ngày..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500">
                  <tr>
                    <th className="p-5">Tên bài thi</th>
                    <th className="p-5">Ngày</th>
                    <th className="p-5 text-center">Số HV</th>
                    <th className="p-5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExams.map((exam, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="p-5 font-bold text-slate-700">{exam.tenBai}</td>
                      <td className="p-5 text-slate-500">{exam.ngay}</td>
                      <td className="p-5 text-center font-semibold text-blue-600">
                        {exam.count}
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openEditModal(exam)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700"
                          >
                            Mở
                          </button>

                          <button
                            onClick={() => handleDeleteExam(exam)}
                            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

function ClassesTab({ myClasses, filteredClasses, classSearch, setClassSearch, navigate, setSelectedClassId, setActiveSibeTab }) {
  return (
    <div className="">
      {/* HEADER */}
      <div className="flex flex-row items-center gap-4">
        <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight"> DANH SÁCH LỚP PHỤ TRÁCH </h1>
        <Users className='center'></Users>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        {/* Nút quay lại */}
        <button onClick={() => navigate('/instructor')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition" > <ArrowLeft size={20} /> Quay lại "Lớp của tôi" </button>

        {/* Ô search */}
        <div className="relative w-full md:w-80"> <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input type="text" placeholder="Tìm theo tên hoặc mã lớp..." value={classSearch} onChange={(e) => setClassSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" /> </div>
      </div>

      <div className="bg-white mt-8 rounded-3xl shadow-sm border border-slate-100 p-6 min-h-[600px] overflow-y-auto">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500">
              <tr>
                <th className="p-5">Mã lớp</th>
                <th className="p-5">Tên lớp</th>
                <th className="p-5 text-center">Sĩ số</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cls) => (
                <tr key={cls.maLop} className="hover:bg-slate-50 transition">
                  <td className="p-5 font-mono font-semibold text-slate-700">
                    {cls.maLop}
                  </td>
                  <td className="p-5 font-bold text-slate-700">
                    {cls.tenLop}
                  </td>
                  <td className="p-5 text-center font-semibold text-blue-600">
                    {cls.siSo}
                  </td>
                  <td className="p-5 text-center">
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.maLop);
                        setActiveSibeTab('DETAIL');
                        navigate('/instructor');   // đổi URL
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN ================= */
export default function InstructorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [activeSibeTab, setActiveSibeTab] = useState('DETAIL');
  const [students, setStudents] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );


  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [exams, setExams] = useState([]);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [examInfo, setExamInfo] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [gradesInput, setGradesInput] = useState({});
  const [toasts, setToasts] = useState([]);

  /* ================= TOAST ================= */
  const addToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // SYNC URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/instructor/classes')) setActiveSibeTab('CLASSES');
    else if (path.includes('/instructor/students')) setActiveSibeTab('STUDENTS');
    else setActiveSibeTab('DETAIL');
  }, [location]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadData();
  }, [attendanceDate, selectedClassId]);

  const loadData = async () => {
    setAttendanceNotes({});
    const db = await getDB();
    await syncAllStores();

    const allClasses = await db.getAll('lop');
    const allUsers = await db.getAll('users');

    const teacherClasses = allClasses.filter(c => c.maGV?.split(',').includes(user.maGV))
      .map(cls => {
        const count = allUsers.filter(
          u => u.role === 'HV' && u.maLop === cls.maLop
        ).length;

        return {
          ...cls,
          siSo: count
        };
      });

    if (teacherClasses.length === 0) {
      setLoading(false);
      return;
    }

    setMyClasses(teacherClasses);
    // Nếu chưa setup thì sẽ chọn lấy cái đầu tiên
    let cls =
      teacherClasses.find(c => c.maLop === selectedClassId) ||
      teacherClasses[0];

    setSelectedClassId(cls.maLop);
    setMyClass(cls);

    if (!cls) {
      setLoading(false);
      return;
    }

    const classStudents = allUsers.filter(
      (u) => u.role === 'HV' && u.maLop === cls.maLop
    );

    /* ==== ATTENDANCE ==== */
    const allAtt = await db.getAll('diemDanh');
    const dailyAtt = allAtt.filter((a) => a.ngay === attendanceDate);

    const mappedStudents = classStudents.map((s) => {
      const att = dailyAtt.find((a) => a.maHV === s.maHV);

      if (att?.nhanXet) {
        setAttendanceNotes((prev) => ({
          ...prev,
          [s.maHV]: att.nhanXet
        }));
      }

      return {
        ...s,
        isPresent: att ? att.coMat : null,
        attId: att ? att.id : null
      };
    });

    setStudents(mappedStudents);

    /* ==== EXAMS ==== */
    const allBaiTap = await db.getAll('baiTap');
    const classExams = allBaiTap.filter(
      (b) => b.maLop === cls.maLop
    );

    const grouped = Object.values(
      classExams.reduce((acc, cur) => {
        if (!acc[cur.tenBai]) {
          acc[cur.tenBai] = {
            tenBai: cur.tenBai,
            ngay: cur.ngay,
            count: 0
          };
        }
        acc[cur.tenBai].count++;
        return acc;
      }, {})
    );

    setExams(grouped);
    setLoading(false);
  };

  /* ================= ATTENDANCE ================= */
  const handleAttendance = async (student, status) => {
    const db = await getDB();
    const note = attendanceNotes[student.maHV] || '';

    const tx = db.transaction('diemDanh', 'readwrite');
    const store = tx.objectStore('diemDanh');

    let recordId = student.attId;

    if (recordId) {
      const existing = await store.get(recordId);
      await store.put({
        ...existing,
        coMat: status,
        nhanXet: note,
        maGV: user.maGV
      });
    } else {
      recordId = await store.add({
        maHV: student.maHV,
        maLop: myClass.maLop,
        ngay: attendanceDate,
        coMat: status,
        nhanXet: note,
        maGV: user.maGV
      });
    }

    await tx.done;

    setStudents((prev) =>
      prev.map((s) =>
        s.maHV === student.maHV
          ? { ...s, isPresent: status, attId: recordId }
          : s
      )
    );

    addToast(
      status ? 'Thành công' : 'Ghi nhận vắng',
      student.name,
      status ? 'success' : 'error'
    );
    await syncAllStores();
  };

  const handleSaveAllAttendance = async () => {
    const db = await getDB();
    const tx = db.transaction('diemDanh', 'readwrite');
    const store = tx.objectStore('diemDanh');

    let count = 0;
    for (const student of students) {
      if (student.isPresent === null) continue;
      const note = attendanceNotes[student.maHV] || '';
      if (student.attId) {
        const existing = await store.get(student.attId);
        await store.put({
          ...existing,
          coMat: student.isPresent,
          nhanXet: note,
          maGV: user.maGV
        });
      } else {
        const newId = await store.add({
          maHV: student.maHV,
          maLop: myClass.maLop,
          ngay: attendanceDate,
          coMat: student.isPresent,
          nhanXet: note,
          maGV: user.maGV
        });
        student.attId = newId;
      }

      count++;
    }
    await tx.done;

    addToast(
      'Thành công',
      `Đã lưu ${count} học viên`,
      'success'
    );
    loadData()
  };

  /* ================= EXAM LOGIC ================= */
  const openCreateModal = () => {
    setEditingExam(null);
    setExamInfo({
      name: '',
      date: new Date().toISOString().split('T')[0]
    });
    setGradesInput({});
    setExamModalOpen(true);
  };

  const openEditModal = async (exam) => {
    const db = await getDB();
    const all = await db.getAll('baiTap');

    const records = all.filter(
      (r) =>
        r.maLop === myClass.maLop &&
        r.tenBai === exam.tenBai
    );

    const mapped = {};
    records.forEach((r) => {
      mapped[r.maHV] = {
        diem: r.diem,
        nhanXet: r.nhanXet
      };
    });

    setGradesInput(mapped);
    setExamInfo({
      name: exam.tenBai,
      date: exam.ngay
    });

    setEditingExam(exam);
    setExamModalOpen(true);
  };

  const handleGradeChange = (maHV, field, value) => {
    if (field === 'diem') {
      // Chỉ cho phép số 0-10 và tối đa 1 dấu chấm
      if (!/^\d*\.?\d*$/.test(value)) return;

      // Giới hạn 0-10
      if (Number(value) > 10) return;
    }
    setGradesInput((prev) => ({
      ...prev,
      [maHV]: { ...prev[maHV], [field]: value }
    }));
  };

  const handleSaveGrades = async () => {
    if (!examInfo.name.trim()) {
      addToast('Lỗi', 'Vui lòng nhập tên bài thi', 'error');
      return;
    }

    const db = await getDB();
    const tx = db.transaction('baiTap', 'readwrite');
    const store = tx.objectStore('baiTap');

    const examName = examInfo.name.trim();
    const all = await store.getAll();

    /* ================= CREATE MODE ================= */
    if (!editingExam) {
      // KIỂM TRA TRÙNG TÊN BÀI (CÙNG LỚP)
      const isExist = all.some(
        r =>
          r.maLop === myClass.maLop &&
          r.tenBai.toLowerCase() === examName.toLowerCase()
      );

      if (isExist) {
        addToast('Lỗi', 'Tên bài thi đã tồn tại trong lớp này', 'error');
        await tx.done;
        return;
      }

      // Nếu không trùng thì tạo mới
      for (const maHV of Object.keys(gradesInput)) {
        const data = gradesInput[maHV];

        if (data?.diem !== '' && data?.diem !== undefined) {
          await store.add({
            maHV,
            maLop: myClass.maLop,
            tenBai: examName,
            diem: Number(data.diem),
            nhanXet: data.nhanXet || '',
            ngay: examInfo.date
          });
        }
      }

      addToast('Thành công', 'Đã tạo bài thi', 'success');
    }

    /* ================= EDIT MODE ================= */
    else {
      for (const maHV of Object.keys(gradesInput)) {
        const data = gradesInput[maHV];

        const existing = all.find(
          r =>
            r.maHV === maHV &&
            r.maLop === myClass.maLop &&
            r.tenBai === examName
        );

        if (existing) {
          await store.put({
            ...existing,
            diem: Number(data.diem),
            nhanXet: data.nhanXet || ''
          });
        }
        else{
          await store.put({
            maHV: maHV,
            maLop: myClass.maLop,
            tenBai: examName,
            diem: Number(data.diem),
            nhanXet: data.nhanXet || '',
            ngay: examInfo.date
          });
        }
      }
      addToast('Cập nhật thành công', 'Đã lưu thay đổi', 'success');
    }

    await tx.done;
    setExamModalOpen(false);
    await syncAllStores();
    loadData();
  };

  const handleDeleteExam = async (exam) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa bài thi "${exam.tenBai}"?\nHành động này không thể hoàn tác!`
    );
    if (!confirmDelete) return;
    const db = await getDB();
    const tx = db.transaction('baiTap', 'readwrite');
    const store = tx.objectStore('baiTap');
    const all = await store.getAll();
    // Lọc các record cần xóa (theo lớp + tên bài)
    const toDelete = all.filter(
      r =>
        r.maLop === myClass.maLop &&
        r.tenBai === exam.tenBai
    );
    for (const record of toDelete) {
      await store.delete(record.id);
    }
    await tx.done;
    addToast('Đã xóa', `Bài thi "${exam.tenBai}" đã được xóa`, 'success');
    await syncAllStores();
    loadData();
  };


  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">
        Đang tải dữ liệu...
      </div>
    );

  if (!myClass)
    return (
      <div className="p-10 text-center text-slate-500">
        Bạn chưa được phân công lớp nào.
      </div>
    );

  const filteredStudents = students.filter((s) => { const keyword = studentSearch.toLowerCase(); return (s.name.toLowerCase().includes(keyword) || s.maHV.toLowerCase().includes(keyword)); });
  const filteredExams = exams.filter((exam) => { const keyword = examSearch.toLowerCase(); return (exam.tenBai.toLowerCase().includes(keyword) || exam.ngay.toString().toLowerCase().includes(keyword)); });
  const filteredClasses = myClasses.filter((cls) => { const keyword = classSearch.toLowerCase(); return (cls.tenLop.toLowerCase().includes(keyword) || cls.maLop.toLowerCase().includes(keyword)); });

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen animate-fade-in relative overflow-y-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {activeSibeTab === 'DETAIL' && loadData && <DetailTab myClass={myClass} myClasses={myClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} activeTab={activeTab} setActiveTab={setActiveTab} students={students} attendanceDate={attendanceDate} setAttendanceDate={setAttendanceDate} attendanceNotes={attendanceNotes} setAttendanceNotes={setAttendanceNotes} handleAttendance={handleAttendance} handleSaveAllAttendance={handleSaveAllAttendance} exams={exams} openCreateModal={openCreateModal} openEditModal={openEditModal} handleDeleteExam={handleDeleteExam} studentSearch={studentSearch} setStudentSearch={setStudentSearch} examSearch={examSearch} setExamSearch={setExamSearch} filteredStudents={filteredStudents} filteredExams={filteredExams} />}
      {activeSibeTab === 'CLASSES' && loadData && <ClassesTab myClasses={myClasses} filteredClasses={filteredClasses} classSearch={classSearch} setClassSearch={setClassSearch} navigate={navigate} setSelectedClassId={setSelectedClassId} setActiveSibeTab={setActiveSibeTab} />}
      {activeSibeTab === 'STUDENTS' && loadData && <StudentsTab />}

      {/* ================= MODAL EXAM ================= */}
      {examModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white w-full max-w-5xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingExam ? 'Chỉnh sửa bài thi' : 'Tạo bài thi mới'}
              </h2>
              <button onClick={() => setExamModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <input
                disabled={editingExam}
                value={examInfo.name}
                onChange={(e) =>
                  setExamInfo({ ...examInfo, name: e.target.value })
                }
                placeholder="Tên bài thi"
                className="border p-3 rounded-xl w-1/2"
              />
              <input
                type="date"
                disabled={editingExam}
                value={examInfo.date}
                onChange={(e) =>
                  setExamInfo({ ...examInfo, date: e.target.value })
                }
                className="border p-3 rounded-xl"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500">
                  <tr>
                    <th className="p-5">Học viên</th>
                    <th className="p-5 text-center w-32">Điểm</th>
                    <th className="p-5">Nhận xét</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.maHV}>
                      <td className="p-5 font-semibold flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{s.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.maHV}</p>
                        </div></td>
                      <td className="p-5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          inputMode="decimal"
                          className="w-20 p-2 text-center font-bold text-blue-600 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                          value={gradesInput[s.maHV]?.diem ?? ''}
                          onChange={(e) => { let value = e.target.value; if (value === '') { handleGradeChange(s.maHV, 'diem', ''); return; } let num = Number(value); if (isNaN(num)) return; if (num < 0) num = 0; if (num > 10) num = 10; handleGradeChange(s.maHV, 'diem', num); }}
                          onBlur={(e) => { if (e.target.value === '') return; let num = Number(e.target.value); if (num < 0) num = 0; if (num > 10) num = 10; handleGradeChange(s.maHV, 'diem', num); }}
                          onPaste={(e) => { const paste = e.clipboardData.getData('text'); const num = Number(paste); if (isNaN(num) || num < 0 || num > 10) { e.preventDefault(); } }}
                        />
                      </td>
                      <td className="p-5">
                        <input
                          className="w-full p-2.5 border border-slate-200 rounded-xl"
                          value={gradesInput[s.maHV]?.nhanXet || ''}
                          placeholder='Vd: Bài kém chất lượng'
                          onChange={(e) =>
                            handleGradeChange(s.maHV, 'nhanXet', e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveGrades}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <Save size={18} />
                {editingExam ? 'Cập nhật' : 'Lưu bài thi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
