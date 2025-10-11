'use client'
import Link from 'next/link'
import logo from '@/Logo.png'
import { usePathname, useRouter } from 'next/navigation'
import { MdLogin, MdLogout, MdDashboard, MdHome, MdMenu, MdClose } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/hooks/useAuth'
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
        <Link href="/" className="inline-flex items-center">
          <img src={logo?.src || '/Logo.png'} alt="SmartReq AI" className="h-8 sm:h-9 w-auto" />
        </Link>

        {/* Desktop Navigation (match Header) */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink href="/" active={pathname === '/'} label="Home" />
          <NavLink href="/features" active={pathname?.startsWith('/features')} label="Features" />
          <NavLink href="/impact" active={pathname?.startsWith('/impact')} label="Impact" />
          {token ? (
            <NavLink href="/dashboard" active={pathname?.startsWith('/dashboard')} label="Dashboard" />
          ) : null}
        </div>

        {/* Right side auth controls */}
        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              <button onClick={() => { logout(); router.push('/auth/login') }} className="text-sm hover:text-gray-700 inline-flex items-center gap-1">
                <MdLogout className="text-xl" /> Logout
              </button>
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
                <MobileNavLink href="/dashboard" active={pathname?.startsWith('/dashboard')} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              ) : null}
              <div className="pt-2 flex gap-2">
                {token ? (
                  <>
                    <button 
                      onClick={() => { router.push('/dashboard'); setIsMobileMenuOpen(false) }}
                      className="flex-1 px-3 py-2 rounded-md hover:bg-gray-50 text-left"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { logout(); router.push('/auth/login'); setIsMobileMenuOpen(false) }} 
                      className="flex-1 px-3 py-2 rounded-md hover:bg-gray-50 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
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


