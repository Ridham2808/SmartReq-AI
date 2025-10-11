import { jwtDecode } from 'jwt-decode'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function decodeToken(token) {
  try { return jwtDecode(token) } catch { return null }
}

export function isTokenExpired(token) {
  const d = decodeToken(token)
  if (!d?.exp) return true
  return Date.now() >= d.exp * 1000
}

/**
 * Utility function to get the correct avatar URL
 * Handles both relative and absolute URLs
 */
export function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  
  // If it's already a full URL (starts with http), return as is
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  // For development, use relative URLs (Next.js will proxy them)
  // For production, prepend the backend URL
  if (process.env.NODE_ENV === 'development') {
    return avatarUrl;
  }
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
                    process.env.NEXT_PUBLIC_BACKEND_URL || 
                    'http://localhost:5000';
  
  return `${backendUrl.replace(/\/$/, '')}${avatarUrl}`;
}

/**
 * Utility function to get the correct file URL for any uploaded file
 */
export function getFileUrl(filePath) {
  if (!filePath) return null;
  
  // If it's already a full URL (starts with http), return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // If it's a relative path, prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
                    process.env.NEXT_PUBLIC_BACKEND_URL || 
                    'http://localhost:5000';
  
  return `${backendUrl.replace(/\/$/, '')}${filePath}`;
}
