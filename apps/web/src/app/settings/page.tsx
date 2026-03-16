'use client'

import { Suspense } from 'react'
import SettingsInner from './settings-inner'

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  )
}

