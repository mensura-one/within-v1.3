'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  function handleCreateNode() {
    const nodeId = crypto.randomUUID()
    router.push(`/node/${nodeId}`)
  }

  function handleJoinNode() {
    const value = prompt('Paste invite link, node link, or connection ID')
    if (!value?.trim()) return

    const input = value.trim()

    try {
      const url = new URL(input)
      window.location.href = url.toString()
      return
    } catch {
      // not a full URL, continue
    }

    if (input.startsWith('/join/')) {
      router.push(input)
      return
    }

    // fallback: if they only pasted a connection ID, keep it light for now
    alert('Use the full invite link for now.')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#111827',
        color: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          display: 'grid',
          gap: '1.25rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          within — stacked runs
        </h1>

        <p
          style={{
            color: '#d1d5db',
            margin: 0,
            fontSize: '0.95rem',
          }}
        >
          No logins · No stored personal data · Trust
        </p>

        <p
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Declare movement. Neighbors coordinate.
        </p>

        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            marginTop: '0.25rem',
          }}
        >
          <button
            onClick={handleCreateNode}
            style={{
              padding: '0.95rem',
              borderRadius: '12px',
              background: '#fbbf24',
              color: '#111827',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create node
          </button>

          <button
            onClick={handleJoinNode}
            style={{
              padding: '0.95rem',
              borderRadius: '12px',
              background: '#374151',
              color: '#f9fafb',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Join node
          </button>
        </div>
      </div>
    </main>
  )
}
