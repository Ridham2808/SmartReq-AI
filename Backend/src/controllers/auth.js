// Auth controller stubs

export const register = async (req, res) => {
  res.json({
    success: true,
    message: 'User registration (to be implemented)',
    data: { userId: 1 }
  })
}

export const login = async (req, res) => {
  res.json({
    success: true,
    message: 'User login (to be implemented)',
    data: { token: 'mock-jwt-token' }
  })
}

export const getMe = async (req, res) => {
  res.json({
    success: true,
    message: 'Get current user (to be implemented)',
    data: { id: 1, name: 'Mock User', email: 'user@example.com' }
  })
}
