interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(secret: string, token: string, remoteip?: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token })
  if (remoteip) body.set('remoteip', remoteip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) return false
  const data = (await res.json()) as TurnstileResult
  return data.success === true
}
