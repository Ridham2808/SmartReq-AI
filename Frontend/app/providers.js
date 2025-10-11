'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { MantineProvider } from '@mantine/core'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useState } from 'react'

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <MantineProvider>
            {children}
            <ToastContainer position="top-right" theme="colored" />
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
          </MantineProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
