"use client"
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, endpoints } from '@/lib/api'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'

const schema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits'),
  email: z.string().email('Please enter a valid email address')
})

function VerifyEmailForm() {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore ? useAuthStore(s => s.token) : null
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [showCode, setShowCode] = useState(false)
  const [apiError, setApiError] = useState('')
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail, code: '' }
  })

  const onSubmit = async (values) => {
    try {
      setApiError('')
      await api.post(endpoints.verifyEmail, { email: values.email, verificationCode: values.code })
      setVerifySuccess(true)
      router.replace('/auth/login?verified=true')
    } catch (error) {
      let errorMessage = 'Verification failed. Please check your code and try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    }
  }

  const onResendCode = async (email) => {
    try {
      setIsResending(true)
      setApiError('')
      await api.post(endpoints.resendVerification, { email })
    } catch (error) {
      let errorMessage = 'Failed to resend verification code. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  // If authenticated, redirect away from auth page
  if (typeof window !== 'undefined' && token) {
    router.replace('/dashboard')
    return null
  }

  // If not on /auth/* route, unmount modal UI
  if (typeof window !== 'undefined' && pathname && !pathname.startsWith('/auth')) {
    return null
  }

  if (verifySuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600">Redirecting to login...</p>
          <div className="mt-4">
            <Loader2 className="mx-auto h-6 w-6 text-blue-600 animate-spin" />
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
          <h2 className="text-2xl font-normal text-gray-800 mb-12">Verify Email</h2>
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
          <p className="text-sm text-gray-600">Didn't get the code? <button onClick={() => onResendCode(initialEmail)} disabled={isResending} className="text-black font-medium underline hover:no-underline disabled:opacity-50">Resend</button></p>
        </div>

        <div className="w-full md:w-1/2 p-10 sm:p-12">
          <h2 className="text-2xl font-normal text-gray-800 mb-8">Enter code</h2>

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Verification Failed</p>
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
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.email ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('email')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Verification Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`${errors.code ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                </div>
                <input
                  type={showCode ? 'text' : 'password'}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className={`w-full pl-10 pr-10 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.code ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('code')}
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowCode(v => !v)}>
                  {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing verification form</p>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}
