import { Resend } from 'resend'

const key = process.env.RESEND_API_KEY

export const resend = key ? new Resend(key) : null

export const FROM = process.env.RESEND_FROM ?? 'TrainHub <training@gpbookkeeper.com.au>'
