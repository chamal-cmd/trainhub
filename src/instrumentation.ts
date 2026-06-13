/**
 * Next.js instrumentation — runs once when the server starts, in the same
 * Node.js context as all route handlers and server components.
 *
 * We use it to configure undici's global dispatcher so that every
 * server-side fetch (including Supabase auth calls) skips TLS verification
 * on the local dev machine where Zscaler intercepts HTTPS traffic.
 */
export async function register() {
  if (process.env.NODE_ENV === 'development') {
    const { setGlobalDispatcher, Agent } = await import('undici')
    setGlobalDispatcher(
      new Agent({ connect: { rejectUnauthorized: false } })
    )
  }
}
