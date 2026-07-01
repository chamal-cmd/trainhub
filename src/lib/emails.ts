// Plain HTML email templates — safe for Cloudflare Workers edge runtime

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f8f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #6d28d9; padding: 28px 32px; }
  .header-logo { color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .header-logo span { opacity: 0.7; font-weight: 400; }
  .body { padding: 32px; }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a; }
  p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569; }
  .btn { display: inline-block; background: #6d28d9; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin: 8px 0 20px; }
  .card { background: #f8f5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
  .card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #7c3aed; margin-bottom: 4px; }
  .card-value { font-size: 15px; font-weight: 600; color: #1e293b; }
  .footer { padding: 20px 32px; background: #f8f8f8; border-top: 1px solid #f1f5f9; }
  .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
  .divider { border: none; border-top: 1px solid #f1f5f9; margin: 8px 0 20px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="header-logo">Train<span>Hub</span></div>
  </div>
  <div class="body">${content}</div>
  <div class="footer"><p>GP Bookkeeper Training Platform &middot; This is an automated message.</p></div>
</div>
</body>
</html>
`

export function inviteEmail({
  fullName,
  inviteUrl,
  invitedByName,
}: {
  fullName: string
  inviteUrl: string
  invitedByName?: string
}) {
  return base(`
    <h1>You've been invited 👋</h1>
    <p>Hi ${fullName || 'there'},</p>
    <p>${invitedByName ? `<strong>${invitedByName}</strong> has invited you` : "You've been invited"} to join <strong>TrainHub</strong> — the GP Bookkeeper training platform.</p>
    <p>Click the button below to set up your account and get started:</p>
    <a class="btn" href="${inviteUrl}">Accept Invitation</a>
    <hr class="divider" />
    <p style="font-size:13px; color:#94a3b8;">This invite link expires in 24 hours. If you weren't expecting this, you can safely ignore it.</p>
  `)
}

export function nudgeEmail({
  userName,
  subjectEmoji,
  subjectTitle,
  dueDate,
  appUrl,
  senderName,
}: {
  userName: string
  subjectEmoji: string
  subjectTitle: string
  dueDate?: string | null
  appUrl: string
  senderName?: string
}) {
  const dueLine = dueDate
    ? `<p>Please complete it by <strong>${new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>`
    : ''
  return base(`
    <h1>New training reminder 🔔</h1>
    <p>Hi ${userName || 'there'},</p>
    <p>${senderName ? `<strong>${senderName}</strong> has` : 'You\'ve been'} nudged you to complete a training module:</p>
    <div class="card">
      <div class="card-label">Training Module</div>
      <div class="card-value">${subjectEmoji} ${subjectTitle}</div>
    </div>
    ${dueLine}
    <p>Log in to TrainHub to view and complete your training:</p>
    <a class="btn" href="${appUrl}/dashboard">Go to Training</a>
    <hr class="divider" />
    <p style="font-size:13px; color:#94a3b8;">You received this because an admin assigned this module to you.</p>
  `)
}

export function welcomeEmail({ fullName, appUrl }: { fullName: string; appUrl: string }) {
  return base(`
    <h1>Welcome to TrainHub! 🎉</h1>
    <p>Hi ${fullName || 'there'},</p>
    <p>Your account is all set up. TrainHub is where you'll find all your GP Bookkeeper training materials, SOPs, and module assignments.</p>
    <a class="btn" href="${appUrl}/dashboard">Start Training</a>
    <hr class="divider" />
    <p style="font-size:13px; color:#94a3b8;">If you have any questions, reach out to your trainer or admin.</p>
  `)
}
