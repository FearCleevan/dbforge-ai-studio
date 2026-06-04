import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('dbforge_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear token and redirect to /login
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dbforge_token')
      localStorage.removeItem('dbforge_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
