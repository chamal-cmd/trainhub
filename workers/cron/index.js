export default {
  async scheduled(event, env, ctx) {
    const res = await fetch('https://trainhub.gpbookkeeper.workers.dev/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': env.CRON_SECRET,
      },
    })
    const body = await res.text()
    console.log(`[reminder-cron] ${res.status}:`, body)
  },
}
