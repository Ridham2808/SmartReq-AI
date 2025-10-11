'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MdLogin, MdLogout, MdDashboard, MdHome, MdMenu, MdClose, MdPerson } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/hooks/useAuth'
import { getAvatarUrl } from '@/lib/utils'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-black">W.</Link>

        {/* Desktop Navigation (match Header) */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink href="/" active={pathname === '/'} label="Home" />
          <NavLink href="/features" active={pathname?.startsWith('/features')} label="Features" />
          <NavLink href="/impact" active={pathname?.startsWith('/impact')} label="Impact" />
          {token ? (
            <>
              <NavLink href="/dashboard" active={pathname?.startsWith('/dashboard')} label="Dashboard" />
              <NavLink href="/predictive-insights" active={pathname?.startsWith('/predictive-insights')} label="Predictive Insights" />
              <NavLink href="/foresight" active={pathname?.startsWith('/foresight')} label="Foresight" />
            </>
          ) : null}
        </div>

        {/* Right side auth controls */}
        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              {/* User Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {user?.avatarUrl ? (
                    <img src={getAvatarUrl(user.avatarUrl)} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user?.name || user?.email}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <MdPerson className="text-lg" />
                      My Profile
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <MdDashboard className="text-lg" />
                      Dashboard
                    </Link>
                    <hr className="my-1" />
                    <button 
                      onClick={() => { logout(); router.push('/auth/login') }} 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <MdLogout className="text-lg" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm hover:text-gray-700 inline-flex items-center gap-1">
                <MdLogin className="text-xl" /> Log in
              </Link>
              <Link href="/auth/register" className="text-sm hover:text-gray-700 inline-flex items-center gap-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <MdClose className="text-xl" /> : <MdMenu className="text-xl" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-white/95 backdrop-blur"
          >
            <div className="max-w-screen-2xl mx-auto px-6 py-4 space-y-2">
              <MobileNavLink href="/" active={pathname === '/'} label="Home" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/features" active={pathname?.startsWith('/features')} label="Features" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/impact" active={pathname?.startsWith('/impact')} label="Impact" onClick={() => setIsMobileMenuOpen(false)} />
              {token ? (
                <>
                  <MobileNavLink href="/dashboard" active={pathname?.startsWith('/dashboard')} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavLink href="/predictive-insights" active={pathname?.startsWith('/predictive-insights')} label="Predictive Insights" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavLink href="/foresight" active={pathname?.startsWith('/foresight')} label="Foresight" onClick={() => setIsMobileMenuOpen(false)} />
                </>
              ) : null}
              {token ? (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <button 
                      onClick={() => { router.push('/profile'); setIsMobileMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left"
                    >
                      <MdPerson className="text-lg" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => { router.push('/dashboard'); setIsMobileMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left"
                    >
                      <MdDashboard className="text-lg" />
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { logout(); router.push('/auth/login'); setIsMobileMenuOpen(false) }} 
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50 text-red-600 text-left"
                    >
                      <MdLogout className="text-lg" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex gap-2">
                  <Link 
                    href="/auth/login" 
                    className="flex-1 px-3 py-2 rounded-md hover:bg-gray-50 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="flex-1 px-3 py-2 rounded-md bg-black text-white text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

function NavLink({ href, label, icon, active }) {
  return (
    <Link href={href} className="relative px-3 py-1.5 rounded-md hover:bg-gray-50">
      <motion.span
        className="absolute inset-0 rounded-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 0.1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: 'var(--tw-ring-color, rgba(79,70,229,0.5))' }}
      />
      <span className="inline-flex items-center gap-1 relative">
        {icon} {label}
      </span>
    </Link>
  )
}

function MobileNavLink({ href, label, icon, active, onClick }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${active ? 'bg-blue-50 text-blue-600' : ''}`}
      onClick={onClick}
    >
      {icon} {label}
    </Link>
  )
}


