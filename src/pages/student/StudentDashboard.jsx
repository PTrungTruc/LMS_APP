import React, { useEffect, useState } from 'react';
import { getDB } from '../../db/db';
import { syncAllStores } from "../../utils/syncToJson";
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  AlertTriangle, CheckCircle, Clock, BookOpen, 
  TrendingUp, Calendar, Star, FileText 
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pct: 100, avg: 0, absent: 0, status: 'GOOD' });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = await getDB();
      const att = await db.getAllFromIndex('diemDanh', 'maHV', user.maHV);
      const grades = await db.getAllFromIndex('baiTap', 'maHV', user.maHV);
      const giangVien = await db.getAll('giangVien');

      // Calc Stats
      const present = att.filter(r => r.coMat).length;
      const total = att.length;
      const pct = total ? Math.round((present / total) * 100) : 100;
      const avg = grades.length ? (grades.reduce((a, b) => a + parseFloat(b.diem), 0) / grades.length).toFixed(1) : 0;
      
      let status = 'GOOD';
      if (pct < 90 || avg < 5.0) status = 'DANGER';
      else if (pct < 95) status = 'WARNING';

      setStats({ pct, avg, absent: total - present, status });

      // Timeline
      const timeline = [
        ...att.map(r => ({ type: 'ATT', date: r.ngay, val: r.coMat, id: r.id, comment: r.nhanXet, giangVien: giangVien.filter(gv => gv.maGV === r.maGV)[0].tenGV })),
        ...grades.map(g => ({ type: 'GRA', date: g.ngay || 'N/A', title: g.tenBai, score: g.diem, comment: g.nhanXet, id: g.id }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setActivities(timeline);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải hồ sơ...</div>;

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen animate-fade-in">
      {/* Hero Banner */}
      <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden ${
        stats.status === 'DANGER' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
        'bg-gradient-to-r from-blue-600 to-cyan-500'
      }`}>
        <div className="relative z-10 flex justify-between items-center">
           <div>
             <p className="text-blue-100 font-bold uppercase tracking-wider text-xs mb-2">Hồ sơ học tập</p>
             <h1 className="text-4xl font-extrabold mb-2">Xin chào, {user.name}</h1>
             <p className="opacity-90 flex items-center gap-2"><Star size={16} fill="white"/> Mã học viên: {user.maHV}</p>
           </div>
           <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
             <p className="text-xs font-bold uppercase mb-1 opacity-80">Đánh giá chung</p>
             <div className="text-2xl font-black flex items-center gap-2">
               {stats.status === 'DANGER' ? <AlertTriangle className="fill-white text-red-600"/> : <CheckCircle className="fill-white text-green-500"/>}
               {stats.status === 'DANGER' ? 'CẢNH BÁO' : 'TỐT'}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Attendance Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
             <h3 className="text-slate-500 font-bold uppercase text-xs mb-4">Tỷ lệ chuyên cần</h3>
             <div className="h-48 relative">
               <ResponsiveContainer>
                 <PieChart>
                   <Pie data={[{val: stats.pct}, {val: 100-stats.pct}]} innerRadius={60} outerRadius={80} dataKey="val" startAngle={90} endAngle={-270}>
                     <Cell fill={stats.pct < 90 ? '#ef4444' : '#22c55e'} stroke="none"/>
                     <Cell fill="#f1f5f9" stroke="none"/>
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={`text-4xl font-black ${stats.pct < 90 ? 'text-red-500' : 'text-green-500'}`}>{stats.pct}%</span>
                 <span className="text-xs text-slate-400 font-bold">Tham gia</span>
               </div>
             </div>
             <div className="flex justify-between mt-4 px-4">
               <div className="text-center"><p className="text-xs text-slate-400 font-bold">Vắng</p><p className="font-bold text-red-500">{stats.absent} buổi</p></div>
               <div className="text-center"><p className="text-xs text-slate-400 font-bold">Yêu cầu</p><p className="font-bold text-slate-700">&gt; 90%</p></div>
             </div>
          </div>

          {/* Grades Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24}/></div>
               <div><p className="text-xs font-bold text-slate-400 uppercase">Điểm Trung Bình</p><h3 className="text-3xl font-black text-slate-800">{stats.avg}</h3></div>
             </div>
             <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">Điểm số dựa trên các bài thi thử và bài tập về nhà.</p>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><Clock className="text-blue-500"/> Nhật ký hoạt động</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {activities.length > 0 ? activities.map((act, i) => (
              <div key={i} className="relative flex items-start gap-4 group">
                 <div className={`absolute left-0 mt-1 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 ${act.type==='ATT' ? (act.val?'bg-green-500':'bg-red-500') : 'bg-blue-500'}`}>
                    {act.type==='ATT' ? (act.val?<CheckCircle size={18} className="text-white"/>:<AlertTriangle size={18} className="text-white"/>) : <FileText size={18} className="text-white"/>}
                 </div>
                 <div className="ml-14 w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800 text-sm">{act.type==='ATT' ? (act.val?'Tham gia lớp học':'Vắng mặt') : act.title}</h4>
                       <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> {act.date}</span>
                    </div>
                    {act.type == 'ATT'&& (<div className="bg-white p-3 rounded-xl border border-slate-100 mt-2"> {act.comment && <p className="text-sm text-slate-600 italic">"{act.comment}" - Điểm danh bởi {act.giangVien}</p>} </div>)}
                    {act.type === 'GRA' && (
                       <div className="bg-white p-3 rounded-xl border border-slate-100 mt-2">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-bold text-slate-400 uppercase">Kết quả</span>
                             <span className="text-lg font-black text-blue-600">{act.score} đ</span>
                          </div>
                          {act.comment && <p className="text-sm text-slate-600 italic">"{act.comment}"</p>}
                       </div>
                    )}
                 </div>
              </div>
            )) : <p className="text-center text-slate-400">Chưa có hoạt động nào.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}