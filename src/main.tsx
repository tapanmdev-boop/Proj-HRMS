import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/custom.css'
import App from './App.tsx'

// Initialize MSW mock service worker in development
async function prepare() {
  if (import.meta.env.DEV) {
    const { setupMocks } = await import('./mocks/setup')
    return setupMocks()
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
