// Minimal proxy helper to forward to external backend when configured.

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''

export function hasExternalBackend() {
  return Boolean(BACKEND_BASE_URL)
}

export async function proxyJson(method, path, body, headers = {}) {
  if (!hasExternalBackend()) throw new Error('NO_BACKEND')
  const url = `${BACKEND_BASE_URL.replace(/\/$/, '')}${path}`
  // Forward Authorization from incoming request if provided via headers.Authorization
  const finalHeaders = { 'Content-Type': 'application/json', ...headers }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    // credentials not included; add auth header if needed by your backend
  })
  if (!res.ok) {
    const text = await res.text()
    const error = new Error(`Proxy ${method} ${path} failed: ${res.status}`)
    error.status = res.status
    error.body = text
    throw error
  }
  return res.json()
}

export async function proxyFormData(method, path, formData, headers = {}) {
  if (!hasExternalBackend()) throw new Error('NO_BACKEND')
  const url = `${BACKEND_BASE_URL.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method,
    headers, // don't set content-type; browser will set with boundary
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    const error = new Error(`Proxy ${method} ${path} failed: ${res.status}`)
    error.status = res.status
    error.body = text
    throw error
  }
  return res.json()
}


