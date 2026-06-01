import { type NextRequest } from 'next/server'

// No middleware logic — matcher set to match nothing so Netlify skips edge bundling
export function middleware(_req: NextRequest) {}

export const config = {
  matcher: [],
}
