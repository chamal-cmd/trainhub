import { NextRequest, NextResponse } from 'next/server'
import { INVITE_CODE_RE, findUserByInviteCode, mintInviteVerifyUrl } from '@/lib/invite'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function originOf(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : new URL(req.url).origin
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>TrainHub invitation</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:36px 32px;max-width:380px;width:calc(100% - 32px);text-align:center;box-shadow:0 1px 3px rgba(15,23,42,.06)}
  .logo{width:44px;height:44px;border-radius:12px;background:#6d28d9;color:#fff;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
  h1{font-size:20px;margin:0 0 8px} p{font-size:14px;line-height:1.5;color:#64748b;margin:0 0 22px}
  button,a.btn{display:inline-block;width:100%;box-sizing:border-box;background:#6d28d9;color:#fff;border:0;border-radius:12px;padding:13px 16px;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer}
  button:hover,a.btn:hover{background:#5b21b6}
</style></head><body><div class="card"><div class="logo">T</div>${body}</div></body></html>`
  return new NextResponse(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex',
    },
  })
}

const invalidPage = () => page(
  `<h1>Invite link not valid</h1><p>This invitation is no longer active. Ask your administrator to send you a new one.</p><a class="btn" href="/login">Go to sign in</a>`,
  404
)

async function resolve(code: string) {
  if (!INVITE_CODE_RE.test(code)) return { kind: 'invalid' as const }
  const user = await findUserByInviteCode(code)
  if (!user || !user.email) return { kind: 'invalid' as const }
  if (user.email_confirmed_at) return { kind: 'joined' as const }
  return { kind: 'pending' as const, user }
}

// Opening the link only shows a confirm button. The Supabase token is minted on
// the button press (POST), so link-preview bots in Slack/email can't burn it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const r = await resolve(code)
  if (r.kind === 'invalid') return invalidPage()
  if (r.kind === 'joined') {
    return page(`<h1>You've already joined</h1><p>This invitation has been accepted. Sign in with your GP Bookkeeper Google account to continue.</p><a class="btn" href="/login">Go to sign in</a>`)
  }
  const name = String((r.user.user_metadata as any)?.full_name ?? '').split(' ')[0]
  return page(
    `<h1>${name ? `Welcome, ${esc(name)}` : 'Welcome to TrainHub'}</h1>
     <p>You've been invited to join the GP Bookkeeper training platform.</p>
     <form method="post" action="/i/${esc(code)}"><button type="submit">Accept invitation</button></form>`
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const origin = originOf(req)
  const r = await resolve(code)
  if (r.kind === 'invalid') return invalidPage()
  if (r.kind === 'joined') return NextResponse.redirect(new URL('/login', origin), 303)

  const verifyUrl = await mintInviteVerifyUrl(r.user.email!, origin)
  if (!verifyUrl) return NextResponse.redirect(new URL('/login?error=auth_failed', origin), 303)
  return NextResponse.redirect(verifyUrl, 303)
}
