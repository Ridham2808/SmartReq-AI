'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, useToast, Spinner } from '@chakra-ui/react'

export default function ProjectDetailPage() {
  const router = useRouter()
  const toast = useToast()  

  // Basic states
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Placeholder for fetch logic (will be added later)
    console.log('Project Detail Page mounted')
  }, [])

  return (
    <main className="container mx-auto px-4 py-10 max-w-7xl">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6 text-center"
      >
        Project Details
      </motion.h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" color="blue.500" />
        </div>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <p className="text-center text-gray-700">Project data will appear here.</p>
      )}
    </main>
  )
}

