'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

function getLocalAliasStorageKey(nodeId: string, connectionId: string) {
  return `local_alias:${nodeId}:${connectionId}`
}

export default function JoinNodePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const nodeId = params?.node_id as string
  const connectionId = searchParams.get('cid') || ''
  const [localNote, setLocalNote] = useState('')

  function handleContinue() {
    const joined = JSON.parse(localStorage.getItem('joined_nodes') || '[]')

    if (!joined.includes(nodeId)) {
      joined.push(nodeId)
      localStorage.setItem('joined_nodes', JSON.stringify(joined))
    }

    if (connectionId && localNote.trim()) {
      localStorage.setItem(
        getLocalAliasStorageKey(nodeId, connectionId),
        localNote.trim()
      )
    }

    router.push(`/node/${nodeId}`)
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
          background: '#1f2937',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Continue to node</h1>

        {connectionId && (
          <div>
            <div
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
              }}
            >
              Shared by
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
              {connectionId}
            </div>
          </div>
        )}

        {connectionId && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label
              htmlFor="local-note"
              style={{
                display: 'block',
                fontWeight: 600,
              }}
            >
              Optional local note
            </label>

            <p style={{ color: '#d1d5db', lineHeight: 1.6, margin: 0 }}>
              How do you want to remember{' '}
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                {connectionId}
              </span>{' '}
              on this device?
              <br />
              Only saved locally. Nobody else can see it.
            </p>

            <input
              id="local-note"
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              placeholder="e.g. Ryan next door"
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
        )}

        <button
          onClick={handleContinue}
          style={{
            padding: '0.9rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: '#fbbf24',
            color: '#111827',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </main>
  )
}
