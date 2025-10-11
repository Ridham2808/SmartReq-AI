'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Home, Zap, TrendingUp, LayoutDashboard, LogIn, UserPlus, LogOut } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import Icon from '@/icon.png'

export default function FooterNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token, logout } = useAuthStore()
  
  const [isExpanded, setIsExpanded] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const navRef = useRef(null)

  // Initialize position on mount and when expanded state changes
  useEffect(() => {
    const updatePosition = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect()
        setPosition({
          x: Math.max(16, Math.min(window.innerWidth - rect.width - 16, window.innerWidth / 2 - rect.width / 2)),
          y: Math.max(16, Math.min(window.innerHeight - rect.height - 16, window.innerHeight - rect.height - 32))
        })
      }
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isExpanded])

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push('/')
    setIsExpanded(false) // Collapse after logout
  }

  const handleMouseDown = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (navRef.current?.offsetWidth || 0) - 16
    const maxY = window.innerHeight - (navRef.current?.offsetHeight || 0) - 16
    
    setPosition({
      x: Math.max(16, Math.min(maxX, newX)),
      y: Math.max(16, Math.min(maxY, newY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const handleTouchStart = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (navRef.current?.offsetWidth || 0) - 16
    const maxY = window.innerHeight - (navRef.current?.offsetHeight || 0) - 16
    
    setPosition({
      x: Math.max(16, Math.min(maxX, newX)),
      y: Math.max(16, Math.min(maxY, newY))
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div 
      ref={navRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="bg-gray-800 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm bg-opacity-95 transition-all duration-300 ease-out"
        style={{
          transform: isExpanded ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Logo/Home Button */}
          <button 
            onClick={() => router.push('/')}
            className="flex items-center justify-center p-2 hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0"
          >
            <img 
              src={Icon?.src || '/icon.png'} 
              alt="SmartReq AI" 
              className="w-8 h-8 object-contain" 
            />
          </button>

          {/* Navigation Links */}
          {isExpanded && (
            <div className="flex items-center gap-1 animate-fadeIn">
              <button 
                onClick={() => router.push('/')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                  pathname === '/' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>

              <button 
                onClick={() => router.push('/features')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                  pathname?.startsWith('/features') 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" />
                Features
              </button>

              <button 
                onClick={() => router.push('/impact')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                  pathname?.startsWith('/impact') 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Impact
              </button>

              {token ? (
                <>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                      pathname?.startsWith('/dashboard') 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-red-300 text-sm font-medium hover:bg-red-900/30 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/auth/login')}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white rounded-xl transition-colors whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                  <button 
                    onClick={() => router.push('/auth/register')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-400 hover:to-purple-500 transition-all whitespace-nowrap shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors flex-shrink-0 ml-1"
            style={{ cursor: 'pointer' }}
          >
            {isExpanded ? (
              <ChevronRight className="w-5 h-5 text-white" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}