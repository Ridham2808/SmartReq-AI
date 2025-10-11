"use client"
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useGenerateMutation(projectId){
  return useMutation({
    mutationFn: (payload) => api.post(`/api/projects/${projectId}/generate`, payload).then(r => r.data)
  })
}


