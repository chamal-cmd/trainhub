'use client'

import { useState, useEffect } from 'react'

function getPeriod() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function Greeting({ firstName }: { firstName: string }) {
  const [period, setPeriod] = useState<string>('')

  useEffect(() => {
    setPeriod(getPeriod())
  }, [])

  if (!period) return null

  return <>Good {period}, {firstName} 👋</>
}
