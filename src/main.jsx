import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App'

registerSW({ immediate: true })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
