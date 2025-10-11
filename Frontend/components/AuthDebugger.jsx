'use client'
import { useAuthStore } from '@/hooks/useAuth'

export default function AuthDebugger() {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)

  return (
    <div className="mb-4 p-3 border rounded bg-gray-50 text-sm">
      <div className="font-medium mb-1">Auth Debugger</div>
      <div>Has user: {user ? 'Yes' : 'No'}</div>
      <div>User email: {user?.email || '-'}</div>
      <div>Has token: {token ? 'Yes' : 'No'}</div>
    </div>
  )
}
