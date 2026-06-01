'use client'

import { useEffect } from 'react'

/** Reads theme from localStorage on mount and applies the dark class to <html> */
export function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem('trainhub-theme') ?? 'light'
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  return null
}
