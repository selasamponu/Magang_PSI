import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// ================================================================
// REGISTER SERVICE WORKER (PWA)
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Cek update setiap 1 jam
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Auto reload saat SW baru aktif (biar user dapat versi terbaru)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// ================================================================
// LOAD LOGO, FAVICON, TITLE DINAMIS
// ================================================================
async function loadAppSettings() {
  try {
    const PROTOCOL = window.location.protocol;
    const HOSTNAME = window.location.hostname;
    const isProd = import.meta.env.PROD;

    const API_URL = isProd
      ? `${PROTOCOL}//${HOSTNAME}/api`
      : `${PROTOCOL}//${HOSTNAME}:5000/api`;

    const FILE_BASE = isProd
      ? `${PROTOCOL}//${HOSTNAME}`
      : `${PROTOCOL}//${HOSTNAME}:5000`;

    const res = await fetch(`${API_URL}/pengaturan`);
    const result = await res.json();

    if (result.success && result.data) {
      const data = result.data;

      // 1. Title
      if (data.nama_aplikasi && data.nama_instansi) {
        document.title = `${data.nama_aplikasi} - ${data.nama_instansi}`;
      }

      // 2. Logo URL
      const logoUrl = data.logo_url
        ? (data.logo_url.startsWith('/uploads/')
            ? `${FILE_BASE}${data.logo_url}`
            : data.logo_url)
        : '/logo.png';

      // 3. Favicon
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = logoUrl;

      // 4. Apple touch icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = logoUrl;

      // 5. Theme color dinamis
      if (data.warna_tema) {
        let themeMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
        if (!themeMeta) {
          themeMeta = document.createElement('meta');
          themeMeta.name = 'theme-color';
          document.head.appendChild(themeMeta);
        }
        themeMeta.content = data.warna_tema;
      }

      console.log('✅ App settings loaded:', { name: data.nama_aplikasi, logo: logoUrl });
    }
  } catch (err) {
    console.error('❌ Error loading app settings:', err);
  }
}

loadAppSettings();

// ================================================================
// RENDER APP
// ================================================================
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

setTimeout(() => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 500);
  }
}, 1000);