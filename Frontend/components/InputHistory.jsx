'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { internalApi } from '@/lib/api'

const InputHistory = ({ projectId, showProjectName = true, limit = 10 }) => {
  const [selectedType, setSelectedType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch input history
  const { data: historyData, isLoading, error, refetch } = useQuery({
    queryKey: ['input-history', projectId, currentPage, selectedType],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: limit
      }
      if (selectedType) {
        params.type = selectedType
      }
      
      const url = projectId 
        ? `/api/input-history/project/${projectId}`
        : '/api/input-history/recent'
      
      const response = await internalApi.get(url, { params })
      return response.data
    },
    enabled: true
  })

  // Fetch input statistics
  const { data: statsData } = useQuery({
    queryKey: ['input-stats'],
    queryFn: async () => {
      const response = await internalApi.get('/api/input-history/stats')
      return response.data
    }
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text':
        return '📝'
      case 'voice':
        return '🎤'
      case 'file':
        return '📄'
      default:
        return '📋'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800'
      case 'voice':
        return 'bg-green-100 text-green-800'
      case 'file':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Error loading input history</h3>
            <p className="text-red-600 text-sm">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle different data structures for project-specific vs recent inputs
  const inputs = projectId 
    ? (historyData?.data?.inputs || [])
    : (historyData?.data || [])
  const pagination = historyData?.data?.pagination
  const stats = statsData?.data

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {projectId ? 'Project Input History' : 'Recent Inputs'}
          </h2>
          <p className="text-gray-600 text-sm">
            {projectId ? 'All inputs for this project' : 'Your recent activity across all projects'}
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-700 font-medium">{stats.totalInputs} total inputs</span>
            </div>
            <div className="bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-700 font-medium">{stats.recentActivity?.last7Days || 0} this week</span>
            </div>
          </div>
        )}
      </div>

      {/* Type Filter */}
      {stats?.inputsByType && stats.inputsByType.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.totalInputs})
          </button>
          {stats.inputsByType.map(({ type, count }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeIcon(type)} {type} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Input History List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : inputs.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inputs found</h3>
          <p className="text-gray-500">
            {selectedType 
              ? `No ${selectedType} inputs found. Try selecting a different type.`
              : 'Start by adding some inputs to your project.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {inputs.map((input, index) => (
              <motion.div
                key={input.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getTypeColor(input.type)}`}>
                    {getTypeIcon(input.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(input.type)}`}>
                        {input.type}
                      </span>
                      {showProjectName && input.project && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {input.project.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(input.createdAt)}
                      </span>
                    </div>
                    
                    <div className="text-gray-900">
                      {input.content ? (
                        <p className="text-sm leading-relaxed">
                          {truncateText(input.content)}
                        </p>
                      ) : input.filePath ? (
                        <p className="text-sm text-gray-600">
                          📄 File: {input.filePath.split('/').pop()}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No content available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination - only show for project-specific inputs */}
      {projectId && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} inputs
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
              {pagination.page}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InputHistory
