// src/api/suratApi.ts
const API_URL = `http://${window.location.hostname}:5000/api`;

// Helper untuk fetch JSON
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Terjadi kesalahan');
  }

  return data;
}

// Helper untuk fetch FormData (upload file)
async function fetchFormData(endpoint: string, formData: FormData, method = 'POST') {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Terjadi kesalahan');
  }

  return data;
}

// ================================================================
// AUTH
// ================================================================
export const authApi = {
  login: async (username: string, password: string) => {
    return fetchApi('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (data: any) => {
    return fetchApi('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ================================================================
// SURAT MASUK
// ================================================================
export const suratMasukApi = {
  getAll: async () => {
    const res = await fetchApi('/surat-masuk');
    return res.data || [];
  },

  create: async (data: any, file: File) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    formData.append('file', file);
    return fetchFormData('/surat-masuk', formData);
  },

  updateStatus: async (id: string, status: string, extra?: any) => {
    return fetchApi(`/surat-masuk/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...extra }),
    });
  },

  delete: async (id: string) => {
    return fetchApi(`/surat-masuk/${id}`, {
      method: 'DELETE',
    });
  },
};

// ================================================================
// SURAT KELUAR
// ================================================================
export const suratKeluarApi = {
  getAll: async () => {
    const res = await fetchApi('/surat-keluar');
    return res.data || [];
  },

  create: async (data: any, file: File) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    formData.append('file', file);
    return fetchFormData('/surat-keluar', formData);
  },

  update: async (id: string, data: any, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    if (file) {
      formData.append('file', file);
    }
    return fetchFormData(`/surat-keluar/${id}`, formData, 'PUT');
  },

  delete: async (id: string) => {
    return fetchApi(`/surat-keluar/${id}`, {
      method: 'DELETE',
    });
  },
};

// ================================================================
// WARGA
// ================================================================
export const wargaApi = {
  getAll: async () => {
    const res = await fetchApi('/warga');
    return res.data || [];
  },

  create: async (data: any) => {
    return fetchApi('/warga', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (nik: string, data: any) => {
    return fetchApi(`/warga/${nik}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (nik: string) => {
    return fetchApi(`/warga/${nik}`, {
      method: 'DELETE',
    });
  },
};

// ================================================================
// USERS
// ================================================================
export const usersApi = {
  getAll: async () => {
    const res = await fetchApi('/users');
    return res.data || [];
  },

  create: async (data: any) => {
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return fetchApi(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchApi(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ================================================================
// KATEGORI
// ================================================================
export const kategoriApi = {
  getAll: async () => {
    const res = await fetchApi('/kategori');
    return res.data || [];
  },
};

// ================================================================
// LOG AKTIVITAS
// ================================================================
export const logApi = {
  getAll: async () => {
    const res = await fetchApi('/logs');
    return res.data || [];
  },

  create: async (data: any) => {
    return fetchApi('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ================================================================
// DASHBOARD
// ================================================================
export const dashboardApi = {
  getStats: async (userType: string, userId?: string) => {
    const url = userId
      ? `/dashboard/${userType}?userId=${userId}`
      : `/dashboard/${userType}`;
    const res = await fetchApi(url);
    return res.data;
  },
};