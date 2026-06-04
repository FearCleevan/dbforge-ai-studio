import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectProvider } from '@/context/ProjectContext'
import { UIProvider } from '@/context/UIContext'
import { ToastProvider } from '@/context/ToastContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          30 * 1000,   // 30s
      gcTime:             5 * 60 * 1000, // 5min
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ProjectProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </ProjectProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
