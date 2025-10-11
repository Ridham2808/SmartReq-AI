"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, endpoints } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'
import logo from '@/Logo.png'

// Step 1: Email input schema
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// Step 2: OTP verification schema
const otpSchema = z.object({
  resetCode: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers')
})

// Step 3: New password schema
const newPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore ? useAuthStore(s => s.token) : null
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [userEmail, setUserEmail] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 1: Email form
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  })

  // Step 2: OTP form
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { resetCode: '' }
  })

  // Step 3: New password form
  const passwordForm = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  })

  // Step 1: Send OTP to email
  const onEmailSubmit = async (values) => {
    try {
      setApiError('')
      setIsSubmitting(true)
      await api.post(endpoints.forgotPassword, values)
      setUserEmail(values.email)
      setCurrentStep(2) // Move to OTP step
    } catch (error) {
      let errorMessage = 'Failed to send reset code. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Verify OTP
  const onOtpSubmit = async (values) => {
    try {
      setApiError('')
      setIsSubmitting(true)
      // Just verify the OTP format, actual verification happens in step 3
      setCurrentStep(3) // Move to new password step
    } catch (error) {
      let errorMessage = 'Invalid OTP. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 3: Set new password
  const onPasswordSubmit = async (values) => {
    try {
      setApiError('')
      setIsSubmitting(true)
      await api.post(endpoints.resetPassword, {
        email: userEmail,
        resetCode: otpForm.getValues('resetCode'),
        newPassword: values.newPassword
      })
      // Password reset successful, redirect to login
      router.push('/auth/login?reset=true')
    } catch (error) {
      let errorMessage = 'Failed to reset password. Please try again.'
      if (error.response?.data?.message) errorMessage = error.response.data.message
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get current form and submit handler
  const getCurrentForm = () => {
    switch (currentStep) {
      case 1:
        return { form: emailForm, onSubmit: onEmailSubmit, errors: emailForm.formState.errors }
      case 2:
        return { form: otpForm, onSubmit: onOtpSubmit, errors: otpForm.formState.errors }
      case 3:
        return { form: passwordForm, onSubmit: onPasswordSubmit, errors: passwordForm.formState.errors }
      default:
        return { form: emailForm, onSubmit: onEmailSubmit, errors: emailForm.formState.errors }
    }
  }

  const { form: currentForm, onSubmit: currentOnSubmit, errors: currentErrors } = getCurrentForm()

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
      <div
        className="relative z-10 bg-white rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden w-full max-w-4xl md:mx-4 mx-2"
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/')}
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="w-full md:w-1/2 bg-gray-50 p-10 sm:p-12 flex flex-col items-center justify-center relative">
          <h2 className="text-2xl font-normal text-gray-800 mb-12">Welcome!</h2>
          <div className="flex items-center gap-4 mb-12">
            <img src={logo?.src || '/Logo.png'} alt="SmartReq AI" className="h-16 sm:h-20 w-auto" />
          </div>
          <p className="text-sm text-gray-600">
            Remember your password? <a href="/auth/login" className="text-black font-medium underline hover:no-underline">Log in now</a>
          </p>
        </div>

        <div className="w-full md:w-1/2 p-10 sm:p-12">
          {/* Step 1: Email Input */}
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-normal text-gray-800 mb-8">Forgot Password</h2>
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

              <form onSubmit={currentForm.handleSubmit(currentOnSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`${currentErrors.email ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${currentErrors.email ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                      {...currentForm.register('email')}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
                  {isSubmitting ? 'Sending Reset Code...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-normal text-gray-800 mb-8">Verify OTP</h2>
              <p className="text-sm text-gray-600 mb-6">Enter the 6-digit code sent to {userEmail}</p>

              {apiError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Verification Failed</p>
                    <p className="text-sm text-red-600 mt-1">{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={currentForm.handleSubmit(currentOnSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">OTP Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`${currentErrors.resetCode ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      className={`w-full pl-10 pr-3 py-2 border-b outline-none text-sm placeholder-gray-300 ${currentErrors.resetCode ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                      {...currentForm.register('resetCode')}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div className="text-center mt-4">
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  ← Back to Email
                </button>
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-normal text-gray-800 mb-8">Set New Password</h2>
              <p className="text-sm text-gray-600 mb-6">Enter your new password</p>

              {apiError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Password Reset Failed</p>
                    <p className="text-sm text-red-600 mt-1">{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={currentForm.handleSubmit(currentOnSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`${currentErrors.newPassword ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-10 py-2 border-b outline-none text-sm placeholder-gray-300 ${currentErrors.newPassword ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                      {...currentForm.register('newPassword')}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`${currentErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'} h-5 w-5`} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-10 py-2 border-b outline-none text-sm placeholder-gray-300 ${currentErrors.confirmPassword ? 'border-red-300' : 'border-gray-300 focus:border-gray-800'}`}
                      {...currentForm.register('confirmPassword')}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium">
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <div className="text-center mt-4">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  ← Back to OTP
                </button>
              </div>
            </>
          )}

          {/* Navigation links - only show on step 1 */}
          {currentStep === 1 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <a href="/auth/login" className="block text-gray-800 hover:text-black font-medium text-sm">Back to Login →</a>
                <a href="/auth/register" className="block text-gray-800 hover:text-black font-medium text-sm">Create a new account →</a>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}
