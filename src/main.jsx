import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 👇 1. Import BrowserRouter từ react-router-dom
import { BrowserRouter } from 'react-router-dom'
// 👇 2. Import AuthProvider (để bọc luôn logic đăng nhập)
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 👇 3. Bọc mọi thứ trong BrowserRouter */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)