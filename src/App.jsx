import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

import AdminDashboard from './pages/admin/AdminDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import BubbleChat from './components/BubbleChat';

function App() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GV', 'HV']} />}>
          <Route element={<MainLayout />}>

            {/* ADMIN ROUTES: Định nghĩa rõ các path con để Sidebar hoạt động */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/classes" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/backup" element={<AdminDashboard />} />
            </Route>

            {/* INSTRUCTOR ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['GV']} />}>
              <Route path="/instructor" element={<InstructorDashboard />} />
              <Route path="/instructor/classes" element={<InstructorDashboard />} />
            </Route>

            {/* STUDENT ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['HV']} />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

    {/* ✅ Chỉ hiển thị cho Student */}
      {user?.role === 'HV' && <BubbleChat />}
    </>
  );
}

export default App;