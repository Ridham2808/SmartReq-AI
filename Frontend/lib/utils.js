import jwt_decode from 'jwt-decode'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function decodeToken(token) {
  try { return jwt_decode(token) } catch { return null }
}

export function isTokenExpired(token) {
  const d = decodeToken(token)
  if (!d?.exp) return true
  return Date.now() >= d.exp * 1000
}


