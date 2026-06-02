export const runtime = 'edge'

import { type NextRequest } from 'next/server'

// Minimal pass-through middleware — auth handled by individual layouts
export function middleware(_req: NextRequest) {}

export const config = {
  matcher: [],
}
