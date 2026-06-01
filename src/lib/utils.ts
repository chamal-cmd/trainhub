import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateString)
}

export const COVER_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0284C7', '#0891B2',
  '#65A30D', '#9333EA', '#E11D48', '#F59E0B',
]

export const COVER_EMOJIS = [
  '📚', '🎯', '🚀', '💡', '🔧', '📊', '🌟', '🎓',
  '💼', '🔑', '📋', '⚙️', '🏆', '🎨', '📝', '🔍',
]
