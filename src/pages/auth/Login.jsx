import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Giả lập độ trễ mạng để nhìn chuyên nghiệp hơn
    setTimeout(async () => {
      const result = await login(email, password);
      if (result.success) {
        switch (result.role) {
          case 'ADMIN': navigate('/admin'); break;
          case 'GV': navigate('/instructor'); break;
          case 'HV': navigate('/student'); break;
          default: navigate('/'); 
        }
      } else {
        setError(result.message);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-sm border border-white/50 backdrop-blur-xl">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-2">Đăng nhập vào hệ thống LMS</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-6 text-sm flex items-center animate-pulse">
             ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
              placeholder="Email của bạn"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
              placeholder="Mật khẩu"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition duration-300 font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Đang xử lý...' : <>Đăng nhập <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-xs text-gray-400 text-center border-t pt-6">
          <p className="mb-2 uppercase tracking-wider font-semibold">Tài khoản Demo</p>
          <div className="grid grid-cols-3 gap-2 text-gray-600">
            <span className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => {setEmail('admin@topik.com'); setPassword('123')}}>Admin</span>
            <span className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => {setEmail('gv@topik.com'); setPassword('123')}}>Giảng viên</span>
            <span className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => {setEmail('hv@topik.com'); setPassword('123')}}>Học viên</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;