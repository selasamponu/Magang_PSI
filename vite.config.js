import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ================================================================
// SECURITY HEADERS
// ================================================================
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: http: https:",
    "connect-src 'self' http: https: ws: wss:",
    "frame-src 'self' http: https: blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
};

// ================================================================
// ✅ PILIH MODE DI SINI — GANTI ANGKA SAJA
// ================================================================
// 1 = Localhost (dev di komputer sendiri)
// 2 = Ngrok (dev via ngrok, domain berubah)
// 3 = VPS / Production (server online)
// ================================================================
const MODE = 1;  // ← UBAH INI sesuai kebutuhan

// ================================================================
// KONFIGURASI HMR (Hot Module Replacement)
// ================================================================
const hmrConfig = {
  // MODE 1: Localhost — HMR jalan normal
  1: {
    protocol: 'ws',
    host: 'localhost',
    clientPort: 3000,
  },
  // MODE 2: Ngrok — HMR via wss ke domain ngrok
  // ⚠️ GANTI 'host' jika URL ngrok Anda berubah!
  2: {
    protocol: 'wss',
    host: 'untoasted-absentee-exporter.ngrok-free.dev',  // ← Ganti jika URL ngrok berubah
    clientPort: 443,
  },
  // MODE 3: VPS — HMR tidak dipakai
  3: false,
};

// ================================================================
// VITE CONFIG
// ================================================================
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',

  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    headers: securityHeaders,

    // Domain yang diizinkan akses dev server
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok.app',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1',
    ],

    // ============================================================
    // ✅ PROXY — HANYA AKTIF DI MODE 1 & 2 (DEV)
    // Di mode 3 (VPS), proxy ini tidak dipakai
    // karena Nginx yang handle /api dan /uploads
    // ============================================================
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },

    // ✅ HMR otomatis sesuai MODE yang dipilih
    hmr: hmrConfig[MODE],
  },

  // ============================================================
  // PREVIEW — untuk testing hasil `npm run build` di lokal
  // ============================================================
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    headers: securityHeaders,
  },

  // ============================================================
  // BUILD — untuk production (VPS)
  // ============================================================
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
});