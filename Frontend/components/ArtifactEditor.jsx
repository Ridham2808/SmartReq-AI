'use client'
import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { internalApi as api } from '@/lib/api'
import { useDebounce } from 'react-use'

export default function ArtifactEditor({ projectId, artifacts, isLoading }) {
  const [userStories, setUserStories] = useState([])
  const [editingStory, setEditingStory] = useState(null)
  const [newStory, setNewStory] = useState('')
  const queryClient = useQueryClient()

  // Initialize user stories from props
  useEffect(() => {
    if (artifacts?.userStories) {
      setUserStories(artifacts.userStories)
    }
  }, [artifacts])

  // Update user story mutation
  const updateStoryMutation = useMutation({
    mutationFn: async ({ storyId, content }) => {
      const { data } = await api.put(`/api/projects/${projectId}/artifacts/user-stories/${storyId}`, { content })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-artifacts', projectId])
    },
    onError: (error) => {
      toast.error(`Failed to update story: ${error.message}`)
    }
  })

  // Add new user story mutation
  const addStoryMutation = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post(`/api/projects/${projectId}/artifacts/user-stories`, { content })
      return data
    },
    onSuccess: () => {
      toast.success('User story added successfully!')
      setNewStory('')
      queryClient.invalidateQueries(['project-artifacts', projectId])
    },
    onError: (error) => {
      toast.error(`Failed to add story: ${error.message}`)
    }
  })

  // Delete user story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId) => {
      const { data } = await api.delete(`/api/projects/${projectId}/artifacts/user-stories/${storyId}`)
      return data
    },
    onSuccess: () => {
      toast.success('User story deleted successfully!')
      queryClient.invalidateQueries(['project-artifacts', projectId])
    },
    onError: (error) => {
      toast.error(`Failed to delete story: ${error.message}`)
    }
  })

  // Debounced save function
  const debouncedSave = useCallback((storyId, content) => {
    if (content.trim()) {
      updateStoryMutation.mutate({ storyId, content })
    }
  }, [updateStoryMutation])

  // Handle story content change with debounce
  const handleStoryChange = (storyId, content) => {
    setUserStories(prev => 
      prev.map(story => 
        story.id === storyId ? { ...story, content } : story
      )
    )
  }

  // Use debounce hook for auto-save
  useDebounce(
    () => {
      if (editingStory) {
        const story = userStories.find(s => s.id === editingStory)
        if (story && story.content.trim()) {
          debouncedSave(editingStory, story.content)
        }
      }
    },
    1000,
    [editingStory, userStories]
  )

  const handleAddStory = () => {
    if (newStory.trim()) {
      addStoryMutation.mutate(newStory.trim())
    }
  }

  const handleDeleteStory = (storyId) => {
    if (window.confirm('Are you sure you want to delete this user story?')) {
      deleteStoryMutation.mutate(storyId)
    }
  }

  const handleKeyPress = (e, storyId) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      setEditingStory(null)
    }
  }

  if (isLoading) {
  return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

  return (
    <div className="space-y-4">
      {/* Add New Story */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <label className="block text-sm font-medium text-gray-700">
          Add New User Story
        </label>
        <div className="flex gap-2">
          <textarea
            value={newStory}
            onChange={(e) => setNewStory(e.target.value)}
            placeholder="As a user, I want to..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleAddStory}
            disabled={!newStory.trim() || addStoryMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {addStoryMutation.isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Add
          </button>
        </div>
      </motion.div>

      {/* User Stories List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">User Stories</h3>
        <AnimatePresence>
          {userStories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <p>No user stories yet. Add one above to get started!</p>
            </motion.div>
          ) : (
            userStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={story.content}
                      onChange={(e) => handleStoryChange(story.id, e.target.value)}
                      onFocus={() => setEditingStory(story.id)}
                      onBlur={() => setEditingStory(null)}
                      onKeyDown={(e) => handleKeyPress(e, story.id)}
                      className="w-full bg-transparent border-none resize-none focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                      rows={Math.max(2, story.content.split('\n').length)}
                      placeholder="As a user, I want to..."
                    />
                    {editingStory === story.id && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 mt-1"
                      >
                        Press Ctrl+Enter to save
                      </motion.div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete story"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Auto-save indicator */}
      {editingStory && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-gray-500"
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span>Auto-saving...</span>
        </motion.div>
      )}
    </div>
  )
}