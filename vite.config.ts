import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` must match the subdirectory this app is deployed under on the live
// server (e.g. https://ecommboxes.com/__-portfolio/hrms/), otherwise built
// assets (JS/CSS) will be requested from the domain root and 404.
export default defineConfig({
  base: '/__-portfolio/hrms/',
  plugins: [react()],
})
