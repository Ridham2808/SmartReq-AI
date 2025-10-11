"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, endpoints } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export default function ForgotPasswordPage(){
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore ? useAuthStore(s => s.token) : null
  const [apiError, setApiError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  })

  const onSubmit = async (values) => {
    try {
      setApiError('')
      setIsSubmitting(true)
      await api.post(endpoints.forgotPassword, values)
      setResetSuccess(true)
    } catch (error) {
      let errorMessage = 'Failed to send reset code. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (resetSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Code Sent!</h2>
          <p className="text-gray-600 mb-4">We've sent a password reset code to your email. Please check your inbox.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/auth/login?reset=true')} className="w-full py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 transition-colors">Go to Login</button>
            <button onClick={() => router.push('/auth/verify-email')} className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Verify Email</button>
          </div>
        </div>
      </div>
    )
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="relative z-10 bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-lg md:mx-4 mx-2" style={{ animation: 'slideIn 0.3s ease-out' }}>
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/')}
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">Forgot Password</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your email to receive the reset code</p>

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Reset Failed</p>
                <p className="text-sm text-red-600 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${errors.email ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                  {...register('email')}
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
              {isSubmitting ? 'Sending Reset Code...' : 'Send Reset Code'}
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
