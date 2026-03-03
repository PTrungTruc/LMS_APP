import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

import { LayoutDashboard, Users, DatabaseBackup, BookOpen, GraduationCap, LogOut, ShieldCheck, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);   // dưới md → collapse
      } else {
        setCollapsed(false);  // trên md → mở lại
      }
    };

    handleResize(); // chạy lần đầu
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  const menus = {
    ADMIN: [
      { label: 'Tổng Quan', path: '/admin', icon: LayoutDashboard },
      { label: 'Quản Lý Lớp', path: '/admin/classes', icon: BookOpen },
      { label: 'Tài Khoản', path: '/admin/users', icon: Users },
      { label: 'Backup', path: '/admin/backup', icon: DatabaseBackup },
    ],
    GV: [
      { label: 'Lớp Của Tôi', path: '/instructor', icon: ClipboardList },
      { label: 'DS Lớp Phụ Trách', path: '/instructor/classes', icon: BookOpen },
    ],
    HV: [
      { label: 'Góc Học Tập', path: '/student', icon: GraduationCap },
    ]
  };

  const currentMenu = user ? menus[user.role] || [] : [];

  return (
    <aside
      className={`
        ${collapsed ? 'w-35' : 'w-72'}
        flex flex-col
        bg-white/80 backdrop-blur-xl
        border-r border-slate-200/60
        transition-all duration-300 ease-in-out
        relative
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center px-5 border-b border-slate-100 py-1">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-xl shadow-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>

          {!collapsed && (
            <div className='transition-all duration-300'>
              <h1 className="text-lg font-bold text-slate-800">
                TOPIK PRO
              </h1>
              <p className="text-xs text-slate-400 tracking-wider">
                LMS SYSTEM
              </p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-2 rounded-lg hover:bg-slate-100 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User */}
      <div className="px-5 py-6 border-b border-slate-100 transition-all duration-300">
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'
            }`}
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md text-lg">
            {user?.name?.charAt(0)}
          </div>

          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role === 'GV'
                  ? 'Giảng Viên'
                  : user?.role === 'HV'
                    ? 'Học Viên'
                    : 'Administrator'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 transition-all duration-300">
        {currentMenu.map((item, idx) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={idx}
              to={item.path}
              end={item.path === '/admin' || item.path === '/instructor' }
              className={({ isActive }) =>
                `group relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'
                } px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`
              }
            >
              <Icon size={20} />

              {!collapsed && <span>{item.label}</span>}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute top-full z-30 mt-3 whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 transition-all duration-300">
        <button
          onClick={handleLogout}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'
            } w-full px-4 py-3 rounded-xl text-sm font-medium
          text-red-500 hover:bg-red-50 transition`}
        >
          <LogOut size={18} />
          {!collapsed && 'Đăng xuất'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;