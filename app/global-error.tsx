'use client';

/**
 * Global error boundary — catches errors in the root layout itself. Must render
 * its own <html>/<body>. Intentionally minimal and self-contained so it works
 * when everything else has failed.
 */
export default function GlobalError({ reset }: { reset: () => void }): React.ReactElement {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#020617',
          textAlign: 'center',
          padding: '1.25rem',
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Error 500
          </p>
          <h1 style={{ fontSize: 40, margin: '1rem 0', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: '#64748b', fontSize: 18 }}>
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 44,
              padding: '0 20px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
