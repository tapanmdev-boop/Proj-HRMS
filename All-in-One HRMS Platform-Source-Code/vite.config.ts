import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` must match the subdirectory this app is deployed under on the live
// server (e.g. https://ecommboxes.com/__-portfolio/hrms/), otherwise built
// production assets (JS/CSS) would be requested from the domain root and
// 404. Locally, though, `npm run dev` should just serve at the plain
// http://localhost:<port>/ root — so the subpath only applies to `build`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/__-portfolio/hrms/' : '/',
  plugins: [react()],
}))
