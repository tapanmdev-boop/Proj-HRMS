import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/custom.css'
import App from './App.tsx'

// Initialize MSW mock service worker in development
async function prepare() {
  // Only use MSW if in development AND USE_MOCKS is not set to 'false'
  const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'
  
  if (useMocks) {
    console.log('[App] Using mock API endpoints')
    const { setupMocks } = await import('./mocks/setup')
    return setupMocks()
  } else {
    console.log('[App] Using real API endpoints')
  }
  return Promise.resolve()
}

// Start the app after MSW initialization
prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
