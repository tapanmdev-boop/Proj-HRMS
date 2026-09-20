// src/mocks/setup.ts
import { worker } from './browser'

// Start the MSW worker and log when it's ready
export async function setupMocks() {
  // Only start the worker in development mode
  if (import.meta.env.MODE === 'development') {
    try {
      // Make sure the worker is properly registered
      await worker.start({
        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
      })
      
      console.log('[MSW] Mock service worker started')
    } catch (error) {
      console.error('[MSW] Failed to start mock service worker:', error)
    }
  }
}
