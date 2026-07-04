import { SMTPServer } from 'smtp-server'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'Framer <onboarding@resend.dev>'

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY required')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  logger: false,

  onData(stream, session, callback) {
    let chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', async () => {
      const raw = Buffer.concat(chunks).toString()

      const fromMatch = raw.match(/FROM:\s*<([^>]+)>/i)
      const toMatch = raw.match(/RCPT TO:\s*<([^>]+)>/gi)
      const subjectMatch = raw.match(/Subject:\s*(.+)/i)

      const from = fromMatch ? fromMatch[1] : FROM_EMAIL
      const to = toMatch
        ? toMatch.map((t) => t.replace(/RCPT TO:\s*<([^>]+)>/i, '$1'))
        : []
      const subject = subjectMatch ? subjectMatch[1].trim() : 'No Subject'

      const bodyStart = raw.indexOf('\r\n\r\n')
      const body = bodyStart >= 0 ? raw.substring(bodyStart + 4) : raw

      if (to.length === 0) {
        callback(new Error('No recipients'))
        return
      }

      try {
        const html = body
          .replace(/=\r\n/g, '')
          .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to,
          subject,
          html,
        })

        console.log(`Email sent to ${to.join(', ')} — id: ${result.data?.id}`)
        callback()
      } catch (err) {
        console.error('Resend error:', err.message)
        callback(new Error('Send failed'))
      }
    })
  },
})

const PORT = 1025
server.listen(PORT, () => {
  console.log(`SMTP relay listening on port ${PORT} → forwarding to Resend`)
})
