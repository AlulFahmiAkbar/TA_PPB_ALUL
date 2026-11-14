import axios from 'axios'
export const getToken = () => localStorage.getItem('kostara_token')
export const setToken = (t) => {
  if (t) {
    localStorage.setItem('kostara_token', t)
  } else {
    localStorage.removeItem('kostara_token')
    localStorage.removeItem('kostara_user')
    localStorage.removeItem('kostara_user_avatar')
  }
}

export const getUser = () => {
  try {
    const val = localStorage.getItem('kostara_user')
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export const setUser = (u) => {
  if (u) {
    try {
      localStorage.setItem('kostara_user', JSON.stringify(u))
    } catch {}
  } else {
    localStorage.removeItem('kostara_user')
  }
}

export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const defaultApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000')
export const api = axios.create({ baseURL: defaultApiUrl + '/api/v1', timeout: 10000 })
api.interceptors.request.use((c) => { const t = getToken(); if (t) c.headers.Authorization = 'Bearer ' + t; return c })
api.interceptors.response.use((r) => r.data.data, (e) => {
  if (e.response?.status === 401) { setToken(null) }
  return Promise.reject({ message: e.response?.data?.message || 'Tidak dapat terhubung ke server. Periksa koneksi Anda.', status: e.response?.status })
})
