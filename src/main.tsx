import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/custom.css'
import App from './App.tsx'

// Initialize MSW mock service worker in development
async function prepare() {
  // MSW is opt-in (VITE_USE_MOCKS=true). Screens talk to the real API by default.
  const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'
  
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
