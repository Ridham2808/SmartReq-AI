'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import Icon from '@/Icon.png'

export default function FooterNav() {
  const router = useRouter()
  const { token, logout } = useAuthStore()
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-zinc-800 rounded-2xl px-3 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center p-2">
            <img src={Icon?.src || Icon} alt="SmartReq AI" className="w-12 h-12 object-contain" />
          </Link>

          <div className="bg-zinc-700 rounded-xl px-4 py-3">
            <Link href="/" className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
              Home
            </Link>
          </div>

          <div className="bg-zinc-700 rounded-xl px-4 py-3">
            <Link href="/features" className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
              Features
            </Link>
          </div>

          <div className="bg-zinc-700 rounded-xl px-4 py-3">
            <Link href="/impact" className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
              Impact
            </Link>
          </div>

          {token ? (
            <div className="bg-zinc-700 rounded-xl px-4 py-3">
              <Link href="/dashboard" className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
                Dashboard
              </Link>
            </div>
          ) : null}

          {token ? (
            <div className="bg-zinc-700 rounded-xl px-4 py-3">
              <button onClick={() => { logout(); router.push('/auth/login') }} className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
                Logout
              </button>
            </div>
          ) : (
            <>
              <div className="bg-zinc-700 rounded-xl px-4 py-3">
                <button onClick={() => router.push('/auth/login')} className="text-white text-sm font-medium hover:text-gray-300 transition-colors whitespace-nowrap">
                  Login
                </button>
              </div>

              <div className="bg-white rounded-xl px-5 py-3">
                <button onClick={() => router.push('/auth/register')} className="text-black text-sm font-medium hover:text-gray-700 transition-colors whitespace-nowrap">
                  Sign Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


