'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { atom, useAtom } from 'jotai'

const userAtom = atom(null)

export const useAuthStore = create(persist((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  _hasHydrated: false,
  setToken: (token) => {
    console.log('🔧 setToken called:', { hasToken: !!token, tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token' })
    set({ token })
  },
  setUser: (user) => {
    console.log('👤 setUser called:', { hasUser: !!user, userEmail: user?.email })
    set({ user })
  },
  login: ({ user, token, refreshToken }) => {
    console.log('🔐 login called:', { 
      hasUser: !!user, 
      hasToken: !!token, 
      hasRefreshToken: !!refreshToken,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    })
    set({ user, token, refreshToken })
  },
  logout: () => {
    console.log('🚪 logout called - clearing all auth data')
    set({ user: null, token: null, refreshToken: null })
  },
  setHasHydrated: (state) => {
    set({ _hasHydrated: state })
  }
}), { 
  name: 'smartreq-auth',
  onRehydrateStorage: () => (state) => {
    console.log('💾 Auth store rehydrated:', {
      hasUser: !!state?.user,
      hasToken: !!state?.token,
      tokenPreview: state?.token ? `${state.token.substring(0, 20)}...` : 'No token'
    })
    state?.setHasHydrated(true)
  }
}))

export function useUserAtom() {
  return useAtom(userAtom)
}


