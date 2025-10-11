"use client"
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, endpoints } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().optional()
})

export default function LoginPage() {
  const router = useRouter()
  const pathname = usePathname()
  const login = useAuthStore(s => s.login)
  const token = useAuthStore(s => s.token)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false }
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now login.')
    } else if (urlParams.get('reset') === 'true') {
      setSuccessMessage('Password reset successfully! You can now login with your new password.')
    }
  }, [])

  const onSubmit = async (values) => {
    try {
      setApiError('')
      const { data } = await api.post(endpoints.login, values)

      const user = data.user || data.data?.user || data.userData
      const token = data.token || data.accessToken || data.jwt || data.data?.token
      const refreshToken = data.refreshToken || data.refresh || data.data?.refreshToken

      login({ user, token, refreshToken })
      router.replace('/dashboard')
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials and try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    }
  }

  // If authenticated, redirect away from auth page
  useEffect(() => {
    if (token) {
      router.replace('/dashboard')
    }
  }, [token, router])

  // If not on /auth/* route, unmount modal UI
  if (typeof window !== 'undefined' && pathname && !pathname.startsWith('/auth')) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div
        className="relative z-10 bg-white rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden w-full max-w-4xl md:mx-4 mx-2"
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.replace('/')}
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="w-full md:w-1/2 bg-gray-50 p-10 sm:p-12 flex flex-col items-center justify-center relative">
          <h2 className="text-2xl font-normal text-gray-800 mb-12">Welcome!</h2>
          <div className="flex items-center gap-4 mb-12">
            <div className="text-6xl sm:text-7xl font-bold text-black">W.</div>
            <div className="relative">
              <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-200 flex items-center justify-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center">
                  <div className="text-3xl sm:text-4xl">
                    <div className="flex gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                    <div className="w-10 sm:w-12 h-3 border-b-4 border-blue-600 rounded-b-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Not a member yet? <a href="/auth/register" className="text-black font-medium underline hover:no-underline">Register now</a>
          </p>
        </div>

        <div className="w-full md:w-1/2 p-10 sm:p-12">
          <h2 className="text-2xl font-normal text-gray-800 mb-8">Log in</h2>

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Success!</p>
                <p className="text-sm text-green-600 mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Login Failed</p>
                <p className="text-sm text-red-600 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`${errors.email ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                </div>
                <input 
                  type="email"
                  placeholder="Email"
                  className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.email ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('email')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`${errors.password ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={`w-full pl-10 pr-10 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.password ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('password')}
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 border-gray-300 rounded" {...register('rememberMe')} />
                <span className="text-sm text-gray-600">Keep me logged in</span>
              </label>
              <a href="/auth/forgot-password" className="text-xs text-gray-600 hover:text-black underline">Forgot your password?</a>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
              {isSubmitting ? 'Signing in...' : 'Log in now'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <a href="/auth/register" className="block text-gray-800 hover:text-black font-medium text-sm">Create a new account →</a>
            <a href="/auth/verify-email" className="block text-gray-800 hover:text-black font-medium text-sm">Verify your email →</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}