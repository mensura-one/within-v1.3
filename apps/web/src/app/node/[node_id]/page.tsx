'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function getWelcomeSeenStorageKey(nodeId: string) {
  return `welcome_seen:${nodeId}`
}

type MovementTiming = 'now_soon' | 'later_today'
type Capacity = 'light' | 'small' | 'open'
type RequestWindow = '30m' | '1h' | '2h' | 'end_by_time'

type Signal = {
  id: string
  nodeId: string
  postedBy: string
  heading: string
  movementTiming: MovementTiming
  capacity: Capacity
  requestWindow: RequestWindow
  endByHour?: string
  createdAt: string
  expiresAt: string
}

function getPosterIdStorageKey(nodeId: string) {
  return `poster_id:${nodeId}`
}

function getNameStorageKey(nodeId: string) {
  return `poster_name:${nodeId}`
}

function formatMovementTiming(value: MovementTiming) {
  return value === 'now_soon' ? 'Now / Soon' : 'Later today'
}

function formatCapacity(value: Capacity) {
  if (value === 'light') return 'Light (1–2 items)'
  if (value === 'small') return 'Small (3–5 items)'
  return 'Open'
}

function hourLabelToDate(label: string) {
  const now = new Date()
  const [time, meridiem] = label.split(' ')
  let [hours] = time.split(':').map(Number)

  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const result = new Date(now)
  result.setHours(hours, 0, 0, 0)

  if (result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 1)
  }

  return result
}

function computeExpiresAt(requestWindow: RequestWindow, endByHour?: string) {
  const now = new Date()

  if (requestWindow === '30m') return new Date(now.getTime() + 30 * 60 * 1000)
  if (requestWindow === '1h') return new Date(now.getTime() + 60 * 60 * 1000)
  if (requestWindow === '2h') return new Date(now.getTime() + 2 * 60 * 60 * 1000)

  return hourLabelToDate(endByHour || '6 PM')
}

function formatRemainingTime(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now()

  if (diffMs <= 0) return 'Closed'

  const totalMinutes = Math.ceil(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return `${minutes} min left`
  if (minutes === 0) return `${hours} hr left`
  return `${hours} hr ${minutes} min left`
}

function formatAbsoluteBoundary(requestWindow: RequestWindow, endByHour?: string) {
  if (requestWindow === '30m') return '30 min'
  if (requestWindow === '1h') return '1 hour'
  if (requestWindow === '2h') return '2 hours'
  return endByHour ? `End by ${endByHour}` : 'End by time'
}

export default function NodePage() {
  const params = useParams()
  const nodeId = params?.node_id as string

  const [posterName, setPosterName] = useState('')
  const [heading, setHeading] = useState('')
  const [movementTiming, setMovementTiming] =
    useState<MovementTiming>('now_soon')
  const [capacity, setCapacity] = useState<Capacity>('light')
  const [requestWindow, setRequestWindow] = useState<RequestWindow>('30m')
  const [endByHour, setEndByHour] = useState('6 PM')
  const [signals, setSignals] = useState<Signal[]>([])
  const [, setTick] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)

  const nameStorageKey = useMemo(() => getNameStorageKey(nodeId), [nodeId])

  function handleDismissWelcome() {
    localStorage.setItem(getWelcomeSeenStorageKey(nodeId), 'true')
    setShowWelcome(false)
  }

  async function loadSignals() {
  if (!nodeId) return

  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .eq('node_id', nodeId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading signals:', error)
    return
  }

  const mappedSignals: Signal[] = (data || []).map((row: any) => {
    const unitsTotal = row.units_total ?? 0

    return {
      id: String(row.id),
      nodeId: row.node_id,
      postedBy: row.posted_by,
      heading: row.purpose || '',
      movementTiming:
        row.direction === 'later_today' ? 'later_today' : 'now_soon',
      capacity:
        unitsTotal <= 2
          ? 'light'
          : unitsTotal <= 5
          ? 'small'
          : 'open',
      requestWindow:
        row.request_window === '30m' ||
        row.request_window === '1h' ||
        row.request_window === '2h' ||
        row.request_window === 'end_by_time'
          ? row.request_window
          : '1h',
      endByHour: row.end_by_hour || undefined,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }
  })

  setSignals(mappedSignals)
}

useEffect(() => {
  if (!nodeId) return

  localStorage.setItem('last_node_id', nodeId)
}, [nodeId])

  useEffect(() => {
  if (!nodeId) return

  const savedName = localStorage.getItem(nameStorageKey) || ''
  setPosterName(savedName)

  const welcomeSeen = localStorage.getItem(getWelcomeSeenStorageKey(nodeId))
  setShowWelcome(!welcomeSeen)

  loadSignals()
}, [nodeId, nameStorageKey])

useEffect(() => {
  if (!nodeId) return

  const interval = setInterval(() => {
    const savedName = localStorage.getItem(nameStorageKey) || ''
    setPosterName(savedName)
    loadSignals()
  }, 5000)

  return () => clearInterval(interval)
}, [nodeId, nameStorageKey])

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  async function handlePostSignal() {
  if (!posterName.trim()) {
    alert('Set your name in Settings first.')
    return
  }

  const expiresAt = computeExpiresAt(requestWindow, endByHour)

  const unitsTotal =
    capacity === 'light' ? 2 : capacity === 'small' ? 5 : 10

  const direction =
    movementTiming === 'later_today' ? 'later_today' : 'now_soon'

  const posterid = localStorage.getitem(getPosterIdStorageKey(nodeId)) || posterName.trim()
  
    const { error } = await supabase.from('signals').insert({
    node_id: nodeId,
    posted_by: posterid,
    direction,
    purpose: heading.trim() || null,
    request_window: requestWindow,
    window_start: new Date().toISOString(),
    window_end: expiresAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    end_by_hour: requestWindow === 'end_by_time' ? endByHour : null,
    units_total: unitsTotal,
    units_claimed: 0,
  })

  if (error) {
    console.error('Error posting signal:', error)
    alert('Could not post signal.')
    return
  }

  setHeading('')
  setMovementTiming('now_soon')
  setCapacity('light')
  setRequestWindow('30m')
  setEndByHour('6 PM')

  await loadSignals()
}

  const visibleSignals = signals.filter(
    (signal) => new Date(signal.expiresAt).getTime() > Date.now()
  )

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.9rem',
              color: '#d1d5db',
            }}
          >
            No logins · No stored personal data · Trust
          </div>

          <Link
            href={`/settings?node_id=${encodeURIComponent(nodeId)}`}
            aria-label="Open settings"
            style={{
              width: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: '#1f2937',
              border: '1px solid #374151',
              color: '#f9fafb',
              fontSize: '1.2rem',
              textDecoration: 'none',
            }}
          >
            ⚙
          </Link>
        </div>

        {showWelcome && (
          <section
            style={{
              background: '#1f2937',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #374151',
            }}
          >
            <p
              style={{
                color: '#f9fafb',
                fontWeight: 700,
                marginTop: 0,
                marginBottom: '0.5rem',
              }}
            >
              within — stacked runs
            </p>

            <p style={{ color: '#d1d5db', marginTop: 0, marginBottom: '0.5rem' }}>
              No logins · No stored personal data · Trust
            </p>

            <p style={{ color: '#d1d5db', marginTop: 0, marginBottom: '1rem' }}>
              Declare movement. Neighbors coordinate.
            </p>

            <button
              onClick={handleDismissWelcome}
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
              Got it
            </button>
          </section>
        )}

        <section
          style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Active Signals</h2>

          {visibleSignals.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No active signals yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {visibleSignals.map((signal) => {
                const aliasKey = `local_alias:${nodeId}:${signal.postedBy}`
                const localAlias = localStorage.getItem(aliasKey)

                return (
                  <div
                    key={signal.id}
                    style={{
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      padding: '0.9rem',
                      background: '#111827',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {localAlias || signal.postedBy}
                    </div>

                    <button
                      onClick={() => {
                        const alias = prompt(
                          `How do you want to remember ${signal.postedBy}?`
                        )

                        if (!alias?.trim()) return

                        localStorage.setItem(aliasKey, alias.trim())
                        setTick((t) => t + 1)
                      }}
                      style={{
                        marginTop: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {localAlias ? 'edit local note' : 'add local note'}
                    </button>

                    {signal.heading && (
                      <div style={{ marginTop: '0.35rem', color: '#d1d5db' }}>
                        Heading: {signal.heading}
                      </div>
                    )}

                    <div style={{ marginTop: '0.35rem', color: '#d1d5db' }}>
                      Movement: {formatMovementTiming(signal.movementTiming)}
                    </div>

                    <div style={{ marginTop: '0.35rem', color: '#d1d5db' }}>
                      Capacity: {formatCapacity(signal.capacity)}
                    </div>

                    <div
                      style={{
                        marginTop: '0.35rem',
                        color: '#fbbf24',
                        fontWeight: 600,
                      }}
                    >
                      {formatRemainingTime(signal.expiresAt)}
                    </div>

                    <div
                      style={{
                        marginTop: '0.5rem',
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                      }}
                    >
                      Reach out directly off-app
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section
          style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Declare Movement</h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label
                htmlFor="heading"
                style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}
              >
                Heading (optional)
              </label>
              <input
                id="heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="e.g. HEB Georgetown"
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

            <div>
              <label
                htmlFor="movementTiming"
                style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}
              >
                Movement timing
              </label>
              <select
                id="movementTiming"
                value={movementTiming}
                onChange={(e) =>
                  setMovementTiming(e.target.value as MovementTiming)
                }
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                }}
              >
                <option value="now_soon">Now / Soon</option>
                <option value="later_today">Later today</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="capacity"
                style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}
              >
                Capacity
              </label>
              <select
                id="capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value as Capacity)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                }}
              >
                <option value="light">Light (1–2 items)</option>
                <option value="small">Small (3–5 items)</option>
                <option value="open">Open</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="requestWindow"
                style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}
              >
                Accept requests until
              </label>
              <select
                id="requestWindow"
                value={requestWindow}
                onChange={(e) => setRequestWindow(e.target.value as RequestWindow)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#f9fafb',
                }}
              >
                <option value="30m">30 min</option>
                <option value="1h">1 hour</option>
                <option value="2h">2 hours</option>
                <option value="end_by_time">End by time</option>
              </select>
            </div>

            {requestWindow === 'end_by_time' && (
              <div>
                <label
                  htmlFor="endByHour"
                  style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}
                >
                  End by
                </label>
                <select
                  id="endByHour"
                  value={endByHour}
                  onChange={(e) => setEndByHour(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    border: '1px solid #374151',
                    background: '#111827',
                    color: '#f9fafb',
                  }}
                >
                  <option>4 PM</option>
                  <option>5 PM</option>
                  <option>6 PM</option>
                  <option>7 PM</option>
                  <option>8 PM</option>
                  <option>9 PM</option>
                </select>
              </div>
            )}

            <button
              onClick={handlePostSignal}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: '#fbbf24',
                color: '#111827',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Post Signal
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

