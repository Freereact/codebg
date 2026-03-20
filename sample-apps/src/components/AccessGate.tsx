import { useEffect, useState } from 'react'

type AccessStatus = 'checking' | 'granted' | 'owner' | 'blocked'

interface AccessResponse {
  granted: boolean
  reason?: string
  loginUrl?: string
  signupUrl?: string
}

export default function AccessGate({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [status, setStatus] = useState<AccessStatus>('checking')

  useEffect(() => {
    fetch(`/api/projects/access/${encodeURIComponent(slug)}`, { credentials: 'include' })
      .then((r) => r.json() as Promise<AccessResponse>)
      .then((d) => {
        if (d.granted) {
          setStatus(d.reason === 'owner' ? 'owner' : 'granted')
        } else {
          setStatus('blocked')
        }
      })
      .catch(() => {
        // API unreachable: if running on codebg.com, fail closed.
        // If self-hosted (different origin), fail open.
        const isCodeBG = window.location.hostname.endsWith('codebg.com')
        setStatus(isCodeBG ? 'blocked' : 'granted')
      })
  }, [slug])

  if (status === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#64748b' }}>
        Loading...
      </div>
    )
  }

  if (status === 'blocked') {
    return <PaywallOverlay />
  }

  return (
    <>
      {status === 'owner' && <PreviewBanner />}
      {children}
    </>
  )
}

function PreviewBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: '#1e293b',
        color: '#e2e8f0',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span>Preview mode — only you can see this site</span>
      <a
        href="/portal/dashboard"
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          background: '#f97316',
          color: '#000',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '12px',
        }}
      >
        Go Live from $19/mo
      </a>
    </div>
  )
}

function PaywallOverlay() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        Code<span style={{ color: '#f97316' }}>BG</span>
      </div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '16px 0 8px' }}>This site is a private preview</h1>
      <p style={{ maxWidth: '400px', color: '#94a3b8', lineHeight: 1.6 }}>
        The owner is building this site on CodeBG — the open website platform for small businesses.
      </p>
      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: '8px',
            background: '#f97316',
            color: '#000',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Sign in to view your preview
        </a>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: '8px',
            border: '1px solid #475569',
            color: '#e2e8f0',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Create your website — free
        </a>
      </div>
    </div>
  )
}
