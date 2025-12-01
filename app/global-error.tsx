"use client"

import { useEffect, useState } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Check if this is a ChunkLoadError (stale webpack chunks)
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message?.includes('ChunkLoadError') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.stack?.includes('__webpack_require__')
  )
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const isChunkError = isChunkLoadError(error)

  useEffect(() => {
    console.error('Global application error:', error)
    
    // Auto-refresh for ChunkLoadError - this usually fixes the issue
    if (isChunkError) {
      // Check if we've already tried refreshing recently to prevent infinite loops
      const lastRefreshKey = 'chunk_error_last_refresh'
      const lastRefresh = sessionStorage.getItem(lastRefreshKey)
      const now = Date.now()
      
      // Only auto-refresh if we haven't refreshed in the last 10 seconds
      if (!lastRefresh || now - parseInt(lastRefresh) > 10000) {
        console.log('ChunkLoadError detected, auto-refreshing...')
        setIsAutoRefreshing(true)
        sessionStorage.setItem(lastRefreshKey, now.toString())
        
        // Small delay to show the message, then hard refresh
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    }
  }, [error, isChunkError])

  // Show a simple loading state for chunk errors that are auto-refreshing
  if (isChunkError && isAutoRefreshing) {
    return (
      <html>
        <body style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              Refreshing...
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Updating application resources
            </p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html>
      <body style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem'
      }}>
        <div style={{ 
          maxWidth: '28rem', 
          width: '100%', 
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: isChunkError ? '#fef3c7' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={isChunkError ? '#d97706' : '#dc2626'}
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              {isChunkError ? 'Update Required' : 'Critical Error'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {isChunkError 
                ? 'The application needs to refresh to load updated resources.'
                : 'The application encountered a critical error.'}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Error Details (Development)
              </summary>
              <div style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '0.75rem', 
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflow: 'auto'
              }}>
                <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {error.name}: {error.message}
                </div>
                {error.stack && (
                  <pre style={{ whiteSpace: 'pre-wrap', color: '#374151', margin: 0 }}>
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </body>
    </html>
  )
}

