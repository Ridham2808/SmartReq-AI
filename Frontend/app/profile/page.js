'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import { useProjectsQuery } from '@/hooks/useProjectsQuery'
import { api, endpoints } from '@/lib/api'
import { getAvatarUrl } from '@/lib/utils'
import { 
  User, 
  Mail, 
  Settings, 
  LogOut, 
  Edit3, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  Database,
  BarChart3,
  Globe,
  Phone,
  Building2,
  MapPin,
  Link as LinkIcon,
  AtSign,
  Github
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, logout, setUser } = useAuthStore()
  const { data: projects } = useProjectsQuery()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company: '',
    location: '',
    website: '',
    bio: '',
    twitter: '',
    linkedin: '',
    github: ''
  })
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    totalInputs: 0,
    totalArtifacts: 0,
    accountAge: '',
    lastActive: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      router.replace('/auth/login')
    }
  }, [token, router])

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      const savedProfile = JSON.parse(localStorage.getItem('smartreq-profile-extra') || '{}')
      const savedAvatar = user.avatarUrl || localStorage.getItem('smartreq-profile-avatar') || ''
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: savedProfile.phone || '',
        role: savedProfile.role || '',
        company: savedProfile.company || '',
        location: savedProfile.location || '',
        website: savedProfile.website || '',
        bio: savedProfile.bio || '',
        twitter: savedProfile.twitter || '',
        linkedin: savedProfile.linkedin || '',
        github: savedProfile.github || ''
      }))
      setAvatarUrl(savedAvatar)
      calculateUserStats()
    }
  }, [user, projects])

  const calculateUserStats = () => {
    if (user && projects) {
      const totalProjects = Array.isArray(projects) ? projects.length : 0
      let totalInputs = 0
      let totalArtifacts = 0

      if (Array.isArray(projects)) {
        projects.forEach(project => {
          if (project.inputs) totalInputs += project.inputs.length
          if (project.artifacts) totalArtifacts += project.artifacts.length
        })
      }

      const accountAge = user.createdAt ? 
        Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0

      setUserStats({
        totalProjects,
        totalInputs,
        totalArtifacts,
        accountAge: `${accountAge} days`,
        lastActive: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Today'
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      }

      const response = await api.put('/api/auth/profile', updateData)
      
      if (response.data.success) {
        setUser(response.data.user)
        setIsEditing(false)
        // Persist extra profile fields locally (until backend supports them)
        const extra = {
          phone: formData.phone,
          role: formData.role,
          company: formData.company,
          location: formData.location,
          website: formData.website,
          bio: formData.bio,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          github: formData.github
        }
        localStorage.setItem('smartreq-profile-extra', JSON.stringify(extra))
        // Prefer server URL in response; fallback to current avatarUrl
        localStorage.setItem('smartreq-profile-avatar', response.data.user?.avatarUrl || avatarUrl || '')
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
    toast.success('Logged out successfully')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    const savedProfile = JSON.parse(localStorage.getItem('smartreq-profile-extra') || '{}')
    setFormData(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phone: savedProfile.phone || '',
      role: savedProfile.role || '',
      company: savedProfile.company || '',
      location: savedProfile.location || '',
      website: savedProfile.website || '',
      bio: savedProfile.bio || '',
      twitter: savedProfile.twitter || '',
      linkedin: savedProfile.linkedin || '',
      github: savedProfile.github || ''
    }))
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAvatarUrl(preview)
    // Upload to backend
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const { data } = await api.post('/api/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      })
      if (data?.user) {
        // Persist server-provided avatar URL to avoid losing it after save
        setAvatarUrl(data.user.avatarUrl || '')
        setUser(data.user)
        localStorage.setItem('smartreq-profile-avatar', data.user.avatarUrl || '')
        toast.success('Profile picture updated')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar')
    }
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account settings and view your activity</p>
      </div>

      {/* Profile Overview Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user?.avatarUrl || avatarUrl ? (
              <img src={getAvatarUrl(avatarUrl || user?.avatarUrl)} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-white border rounded-full px-3 py-1 text-xs cursor-pointer shadow">
                Change
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-1">
                {user.isVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <span className={`text-sm ${user.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalProjects}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.totalInputs}</div>
                <div className="text-sm text-gray-500">Inputs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.totalArtifacts}</div>
                <div className="text-sm text-gray-500">Artifacts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.accountAge}</div>
                <div className="text-sm text-gray-500">Member</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Profile Settings */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. +91 98765 43210"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formData.phone || '—'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, Country"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formData.location || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Business Analyst"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formData.role || '—'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. SmartReq AI"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formData.company || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <a href={formData.website || '#'} target="_blank" className="text-blue-600 hover:underline">
                      {formData.website || '—'}
                    </a>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell something about yourself..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-line">
                    {formData.bio || '—'}
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@username"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <AtSign className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formData.twitter || '—'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Profile URL"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <LinkIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 truncate">{formData.linkedin || '—'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="username or URL"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
                      <Github className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 truncate">{formData.github || '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Created</span>
                <span className="text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Status</span>
                <span className={`text-sm font-medium ${user.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm font-medium">{userStats.lastActive}</span>
              </div>
            </div>
          </motion.div>

          {/* Activity Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Activity Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total Projects</span>
                </div>
                <span className="text-sm font-medium">{userStats.totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total Inputs</span>
                </div>
                <span className="text-sm font-medium">{userStats.totalInputs}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Generated Artifacts</span>
                </div>
                <span className="text-sm font-medium">{userStats.totalArtifacts}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left"
              >
                <Database className="w-4 h-4" />
                View Projects
              </button>
              <button
                onClick={() => router.push('/features')}
                className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Globe className="w-4 h-4" />
                Explore Features
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
