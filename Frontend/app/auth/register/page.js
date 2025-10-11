"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, endpoints } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, XCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function RegisterPage(){
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore ? useAuthStore(s => s.token) : null
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showLoginOption, setShowLoginOption] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastResendAttempt, setLastResendAttempt] = useState(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (values) => {
    try {
      setApiError('')
      setShowLoginOption(false)
      const response = await api.post(endpoints.register, {
        name: values.name,
        email: values.email,
        password: values.password
      })
      setUserEmail(values.email)
      setRegisterSuccess(true)
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.'
      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes('already')) {
          errorMessage = 'An account with this email already exists. Try logging in.'
          setShowLoginOption(true)
        } else {
          errorMessage = error.response?.data?.message || errorMessage
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      setApiError(errorMessage)
    }
  }

  const onResendVerification = async () => {
    try {
      setIsResending(true)
      setApiError('')
      setResendSuccess(false)
      setLastResendAttempt(new Date())
      await api.post(endpoints.resendVerification, { email: userEmail })
      setResendSuccess(true)
      setRetryCount(0)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (error) {
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)
      let errorMessage = 'Failed to resend verification email. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
      setResendSuccess(false)
    } finally {
      setIsResending(false)
    }
  }

  // If authenticated, redirect away from auth page
  if (typeof window !== 'undefined' && token) {
    router.replace('/dashboard')
    return null
  }

  if (registerSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-4">A verification email has been sent to your email address.</p>
          {resendSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">Verification email sent. Please check your inbox.</p>
              {lastResendAttempt && (
                <p className="text-xs text-green-500 mt-1">Sent at: {lastResendAttempt.toLocaleTimeString()}</p>
              )}
            </div>
          )}
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{apiError}</p>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/auth/verify-email?email=${encodeURIComponent(userEmail)}`)}
              className="w-full py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              Verify Email Now
            </button>
            <button
              onClick={onResendVerification}
              disabled={isResending}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="relative z-10 bg-white rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden w-full max-w-4xl md:mx-4 mx-2" style={{ animation: 'slideIn 0.3s ease-out' }}>
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
            Already a member? <a href="/auth/login" className="text-black font-medium underline hover:no-underline">Log in now</a>
          </p>
        </div>

        <div className="w-full md:w-1/2 p-10 sm:p-12">
          <h2 className="text-2xl font-normal text-gray-800 mb-8">Register with your e-mail</h2>

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Registration Failed</p>
                <p className="text-sm text-red-600 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Username (*)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.name ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('name')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Email (*)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  placeholder="E-mail"
                  className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.email ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('email')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Password (*)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
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
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Repeat Password (*)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat Password"
                    className={`w-full pl-10 pr-10 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                    {...register('confirmPassword')}
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowConfirmPassword(v => !v)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}


