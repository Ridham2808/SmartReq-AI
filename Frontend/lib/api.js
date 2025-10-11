import axios from 'axios'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '@/hooks/useAuth'

// Resolve API base URL with safe fallbacks for production
const baseURL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  '' // Use local Next.js API routes in development
).replace(/\/$/, '')

export const api = axios.create({ baseURL, withCredentials: false })

// Always-relative client for calling Next.js App Router API routes (same-origin)
export const internalApi = axios.create({ baseURL: '', withCredentials: false })
// Attach Authorization header to internal Next.js API requests as well
internalApi.interceptors.request.use((config) => {
  try {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.error('Internal API Interceptor Error:', error)
  }
  return config
})

api.interceptors.request.use((config) => {
  try {
    const { token, refreshToken, setToken } = useAuthStore.getState()
    
    if (token) {
      // refresh if expiring within 30s
      const decoded = jwtDecode(token)
      const expMs = (decoded?.exp || 0) * 1000
      const timeUntilExpiry = expMs - Date.now()
      
      if (timeUntilExpiry < 30000 && refreshToken) {
        // fire-and-forget refresh; keep request flowing
        refreshAuthToken(refreshToken).then((t) => t && setToken(t)).catch(() => {})
      }
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.error('API Interceptor Error:', error)
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    
    const msg = error?.response?.data?.message || error.message || 'Request failed'
    
    // Special handling for auth errors
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 500 && error.config?.url?.includes('resend-verification')) {
      // Don't show toast for resend verification 500 errors - let the component handle it
    } else if (error.response?.status === 400 && error.config?.url?.includes('register')) {
      // Don't show toast for registration 400 errors - let the component handle it
    } else {
      toast.error(msg)
    }
    
    return Promise.reject(error)
  }
)

async function refreshAuthToken(refreshToken) {
  try {
    const { data } = await axios.post(`${baseURL.replace(/\/$/, '')}/api/auth/refresh`, { refreshToken })
    return data?.token
  } catch (e) {
    return null
  }
}

// API endpoints - Updated to match new backend structure
export const endpoints = {
  // Authentication endpoints
  login: '/api/auth/login',
  register: '/api/auth/register',
  me: '/api/auth/me',
  
  // Email verification endpoints
  verifyEmail: '/api/auth/verify-email',
  resendVerification: '/api/auth/resend-verification',
  
  // Password reset endpoints
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
  
  // Project endpoints
  projects: '/api/projects',
  createProject: '/api/projects',
  updateProject: (id) => `/api/projects/${id}`,
  deleteProject: (id) => `/api/projects/${id}`,
}

// Auth service functions
export const authService = {
  getCurrentUser: async () => {
    try {
      const response = await api.get(endpoints.me)
      return response.data
    } catch (error) {
      throw error
    }
  }
}


