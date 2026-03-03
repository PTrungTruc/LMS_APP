import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API = process.env.VITE_CHAT_API_URL;
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})