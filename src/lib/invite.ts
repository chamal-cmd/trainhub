import { createClient } from '@supabase/supabase-js'

// Permanent, short invite links. Supabase invite tokens always expire (max 24h),
// so the link we hand out is just a stable code stored on the pending user.
// A fresh Supabase token is minted every time someone actually opens the link.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY!

// No 0/1/i/l/o so a code survives being read aloud or retyped
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const INVITE_CODE_RE = /^[a-hj-km-np-z2-9]{10}$/

export function adminClient() {
  return createClient(SB_URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function newInviteCode(length = 10): string {
  const limit = 256 - (256 % ALPHABET.length)
  let code = ''
  while (code.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && code.length < length) code += ALPHABET[b % ALPHABET.length]
    }
  }
  return code
}

export async function findUserByInviteCode(code: string) {
  const supabase = adminClient()
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) return null
    const match = data.users.find((u: any) => u.app_metadata?.invite_code === code)
    if (match) return match
    if (data.users.length < 1000) return null
    page++
  }
}

export async function mintInviteVerifyUrl(email: string, origin: string): Promise<string | null> {
  const redirectTo = `${origin}/auth/accept`
  const { data, error } = await adminClient().auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })
  const hashedToken = (data as any)?.properties?.hashed_token
  if (error || !hashedToken) return null
  return `${SB_URL}/auth/v1/verify?token=${encodeURIComponent(hashedToken)}&type=invite&redirect_to=${encodeURIComponent(redirectTo)}`
}
