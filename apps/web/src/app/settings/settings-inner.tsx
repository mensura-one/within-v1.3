'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const DISCONNECT_PHRASE = 'disconnect this device'

function getNameStorageKey(nodeId: string) {
  return `poster_name:${nodeId}`
}

function getPosterSuffixStorageKey(nodeId: string) {
  return `poster_suffix:${nodeId}`
}

function getPosterIdStorageKey(nodeId: string) {
  return `poster_id:${nodeId}`
}

function getSignalsStorageKey(nodeId: string) {
  return `signals:${nodeId}`
}

function slugifyName(name: string) {
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned || 'neighbor'
}

function generate4DigitSuffix() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const nodeId = searchParams.get('node_id') || ''

  const [draftName, setDraftName] = useState('')
  const [posterSuffix, setPosterSuffix] = useState('')
  const [posterId, setPosterId] = useState('')
  const [disconnectInput, setDisconnectInput] = useState('')
  const [showNodeDetails, setShowNodeDetails] = useState(false)

  const nameStorageKey = useMemo(() => getNameStorageKey(nodeId), [nodeId])
  const posterSuffixStorageKey = useMemo(
    () => getPosterSuffixStorageKey(nodeId),
    [nodeId]
  )
  const posterIdStorageKey = useMemo(
    () => getPosterIdStorageKey(nodeId),
    [nodeId]
  )

  useEffect(() => {
    if (!nodeId) return

    const savedName = localStorage.getItem(nameStorageKey) || ''
    const savedSuffix = localStorage.getItem(posterSuffixStorageKey) || ''
    const savedPosterId = localStorage.getItem(posterIdStorageKey) || ''

    setDraftName(savedName)
    setPosterSuffix(savedSuffix)
    setPosterId(savedPosterId)
  }, [nodeId, nameStorageKey, posterSuffixStorageKey, posterIdStorageKey])

  function handleSaveName() {
    const trimmedName = draftName.trim()
    if (!trimmedName) {
      alert('Enter your first name first.')
      return
    }

    const suffix = posterSuffix || generate4DigitSuffix()
    const nextPosterId = `${slugifyName(trimmedName)}${suffix}`

    localStorage.setItem(nameStorageKey, trimmedName)
    localStorage.setItem(posterSuffixStorageKey, suffix)
    localStorage.setItem(posterIdStorageKey, nextPosterId)

    setPosterSuffix(suffix)
    setPosterId(nextPosterId)

    alert('Name saved')
  }

  function handleCopyNodeLink() {
    if (!nodeId) {
      alert('No node selected.')
      return
    }

    const url = posterId
      ? `${window.location.origin}/join/${nodeId}?cid=${encodeURIComponent(
          posterId
        )}`
      : `${window.location.origin}/join/${nodeId}`

    navigator.clipboard.writeText(url)
    alert('Invite link copied')
  }

  function handleDisconnect() {
    if (disconnectInput.trim().toLowerCase() !== DISCONNECT_PHRASE) return

    localStorage.removeItem(nameStorageKey)
    localStorage.removeItem(posterSuffixStorageKey)
    localStorage.removeItem(posterIdStorageKey)
    localStorage.removeItem(getSignalsStorageKey(nodeId))

    const joinedNodes = JSON.parse(
      localStorage.getItem('joined_nodes') || '[]'
    ) as string[]
    const nextJoinedNodes = joinedNodes.filter((id) => id !== nodeId)
    localStorage.setItem('joined_nodes', JSON.stringify(nextJoinedNodes))

    window.location.href = '/'
  }

  const canDisconnect =
    disconnectInput.trim().toLowerCase() === DISCONNECT_PHRASE

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#111827',
        color: '#f9fafb',
        padding: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            href={nodeId ? `/node/${nodeId}` : '/'}
            style={{ color: '#fbbf24', textDecoration: 'none' }}
          >
            ← Back
          </Link>
        </div>

        <section
          style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <h1 style={{ marginTop: 0 }}>Settings</h1>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label
                htmlFor="name"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontWeight: 600,
                }}
              >
                Your name in this node
              </label>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: '0.5rem',
                  color: '#d1d5db',
                  fontSize: '0.95rem',
                }}
              >
                Type only your first name here — nothing too personal.
              </p>

              <input
                id="name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Ryan"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                }}
              />
            </div>

            <button
              onClick={handleSaveName}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: '#374151',
                color: '#f9fafb',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Name
            </button>

            <div>
              <div
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontWeight: 600,
                }}
              >
                Your connection ID
              </div>
              <div
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#d1d5db',
                  wordBreak: 'break-all',
                }}
              >
                {posterId || 'Save your name to generate a connection ID'}
              </div>
            </div>

            <button
              onClick={handleCopyNodeLink}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: '#fbbf24',
                color: '#111827',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Copy Invite Link
            </button>

            <button
              onClick={() => setShowNodeDetails((v) => !v)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                background: '#111827',
                color: '#d1d5db',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showNodeDetails ? 'Hide node details' : 'Show node details'}
            </button>

            {showNodeDetails && (
              <div>
                <div
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  Node ID
                </div>
                <div
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    border: '1px solid #374151',
                    background: '#111827',
                    color: '#d1d5db',
                    wordBreak: 'break-all',
                  }}
                >
                  {nodeId || 'No node selected'}
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Disconnect this device</h2>

          <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
            Type{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              {DISCONNECT_PHRASE}
            </span>{' '}
            to confirm.
          </p>

          <input
            id="disconnect-confirmation"
            value={disconnectInput}
            onChange={(e) => setDisconnectInput(e.target.value)}
            placeholder={DISCONNECT_PHRASE}
            aria-describedby="disconnect-help"
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              background: '#111827',
              color: '#f9fafb',
              outlineOffset: '2px',
            }}
          />

          <p
            id="disconnect-help"
            style={{
              marginTop: '0.6rem',
              color: canDisconnect ? '#86efac' : '#9ca3af',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            {canDisconnect
              ? 'Disconnect enabled'
              : 'Type the full phrase to enable disconnect'}
          </p>

          <button
            onClick={handleDisconnect}
            disabled={!canDisconnect}
            aria-disabled={!canDisconnect}
            style={{
              marginTop: '1rem',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              border: canDisconnect
                ? '2px solid #fca5a5'
                : '1px solid #374151',
              background: canDisconnect ? '#7f1d1d' : '#111827',
              color: '#f9fafb',
              fontWeight: 700,
              cursor: canDisconnect ? 'pointer' : 'not-allowed',
              opacity: canDisconnect ? 1 : 0.75,
              boxShadow: canDisconnect
                ? '0 0 0 2px rgba(252,165,165,0.2)'
                : 'none',
            }}
          >
            Disconnect
          </button>
        </section>

        <section
          style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>About</h2>
          <p
            style={{
              color: '#f9fafb',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            within — stacked runs
          </p>
          <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
            No logins. No stored personal data. Trust.
          </p>
          <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
            Pilot feedback / accessibility requests:
            <br />
            mensura.one@gmail.com
          </p>
        </section>
      </div>
    </main>
  )
}
