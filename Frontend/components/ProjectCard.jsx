import Link from 'next/link'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function ProjectCard({ project }){
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/api/projects/${project.id}`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })
  return (
    <motion.div 
      whileHover={{ y: -3 }} 
      className="rounded-lg border p-4 sm:p-6 hover:shadow-lg transition-all duration-200 bg-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-medium text-sm sm:text-base truncate">{project.name}</h3>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
        {project.description || 'No description'}
      </p>
      <div className="mt-4 flex justify-between items-center gap-3">
        <Link 
          className="text-brand hover:text-blue-700 font-medium text-sm transition-colors" 
          href={`/dashboard/projects/${project.id}`}
        >
          Open →
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${project.id}?edit=true`} className="text-xs text-gray-600 hover:text-black underline">
            Edit
          </Link>
          <button onClick={() => deleteMutation.mutate()} className="text-xs text-red-600 hover:text-red-700 underline">
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}


