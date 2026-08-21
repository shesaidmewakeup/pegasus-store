import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Базовый путь — подпапка GitHub Pages. При деплое на другой адрес
// (например, на корень своего домена) замените значение на '/'.
export default defineConfig({
  base: '/pegasus-store/',
  plugins: [react(), tailwindcss()],
});
