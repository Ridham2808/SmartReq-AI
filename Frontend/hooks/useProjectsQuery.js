"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useProjectsQuery(){
  return useQuery({ 
    queryKey: ['projects'], 
    queryFn: async () => {
      try {
        const response = await api.get('/api/projects')
        console.log('📊 Projects API Response:', {
          status: response.status,
          data: response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          keys: response.data ? Object.keys(response.data) : 'No data'
        })
        
        // Handle different response formats
        let projects = response.data

        // Next: our backend returns { success, data: { projects: [], pagination } }
        if (response.data && response.data.data) {
          const inner = response.data.data
          // Prefer array under data.projects
          if (Array.isArray(inner.projects)) {
            projects = inner.projects
          } else {
            projects = inner
          }
        }

        // Generic results field support
        if (response.data && Array.isArray(response.data.results)) {
          projects = response.data.results
        }

        // Direct projects field support
        if (response.data && Array.isArray(response.data.projects)) {
          projects = response.data.projects
        }
        
        // Ensure it's an array
        if (!Array.isArray(projects)) {
          console.warn('⚠️ Projects data is not an array:', projects)
          return []
        }
        
        return projects
      } catch (error) {
        console.error('❌ Projects fetch error:', error)
        return []
      }
    }
  })
}

export function useCreateProject(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/api/projects', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })
}


