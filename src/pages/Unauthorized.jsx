import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Cấm truy cập</h1>
      <p className="text-gray-600 mb-6">Bạn không có quyền truy cập vào trang này.</p>
      <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Quay lại trang đăng nhập
      </Link>
    </div>
  );
};

export default Unauthorized;