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
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// ================================================================
// LOAD LOGO & FAVICON DINAMIS DARI DATABASE
// ================================================================
async function loadAppSettings() {
  try {
    const API_URL = `http://${window.location.hostname}:5000/api`;
    const res = await fetch(`${API_URL}/pengaturan`);
    const result = await res.json();

    if (result.success && result.data) {
      const data = result.data;

      // 1. Update Title
      if (data.nama_aplikasi && data.nama_instansi) {
        document.title = `${data.nama_aplikasi} - ${data.nama_instansi}`;
      }

      // 2. Update Favicon
      const logoUrl = data.logo_url
        ? (data.logo_url.startsWith('/uploads/')
            ? `http://${window.location.hostname}:5000${data.logo_url}`
            : data.logo_url)
        : '/logo.png';

      // Update favicon
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = logoUrl;

      // Update apple-touch-icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = logoUrl;

      console.log('✅ App settings loaded:', {
        name: data.nama_aplikasi,
        logo: logoUrl,
      });
    }
  } catch (err) {
    console.error('❌ Error loading app settings:', err);
  }
}

// Load settings sebelum render
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