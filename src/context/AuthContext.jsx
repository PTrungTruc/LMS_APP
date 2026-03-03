import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDB } from '../db/db';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_CHAT_API_URL || "";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khôi phục session từ localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const db = await getDB();
    const tx = db.transaction('users', 'readonly');
    const index = tx.store.index('email');
    const userRecord = await index.get(email);

    if (userRecord && userRecord.password === password) {
      // Kết nối đến tạo hàm để đăng nhập đến api để lưu state trên api port đó
      // Lọc role trước khi gọi API
      if (userRecord.role === 'HV') {
        const apiResult = await loginViaAPIChat(email, password);
        if (!apiResult.success) {
          return apiResult;
          // return { success: false, message: 'Đã xảy ra lỗi hệ thống' };
        }
      }
      // Lưu session (Lưu ý: Demo nên lưu plain text, thực tế cần hash)
      const userData = { ...userRecord, password: '' }; // Không lưu pass vào state
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true, role: userRecord.role };
    }
    return { success: false, message: 'Sai email hoặc mật khẩu' };
  };

  const loginViaAPIChat = async (email, password) => {
    try {
      // 1️⃣ Đăng ký
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: email,
          password
        })
      });

      // 2️⃣ Đăng nhập
      const loginResponse = await fetch(`${API_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // QUAN TRỌNG
        body: JSON.stringify({
          username: email,
          password
        })
      });

      // const loginResponse = await fetch(`${API_URL}/api/auth/callback/credentials`, {
      //   method: "POST",
      //   credentials: "include", // ⚠️ cực kỳ quan trọng
      //   headers: {
      //     "Content-Type": "application/x-www-form-urlencoded",
      //   },
      //   body: new URLSearchParams({
      //     email,
      //     password,
      //     csrfToken: await getCsrfToken(),
      //   }),
      // })

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        return {
          success: false,
          message: loginData.message || 'Đăng nhập thất bại'
        };
      }

      return {
        success: true,
        data: loginData
      };

    } catch (error) {
      return { success: false, message: 'Lỗi kết nối server' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);