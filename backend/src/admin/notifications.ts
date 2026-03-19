import { config } from '../config.js'

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.mailFrom, to: [to], subject, text }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const status = response.status
    console.error(`[notify] email failed (${status}) to ${to}`)
  }
}

export async function notifyUserFeedbackResponse(
  userEmail: string,
  userName: string,
  projectId: string,
  sectionTitle: string,
  adminResponse: string,
): Promise<void> {
  await sendEmail(
    userEmail,
    'New message on your CodeBG project',
    `Hi ${userName},

The CodeBG team responded to your feedback on "${sectionTitle}":

"${adminResponse}"

View the full conversation:
${config.frontendUrl}/portal/projects/${projectId}/review

— CodeBG`,
  )
}

export async function notifyUserStatusChange(
  userEmail: string,
  userName: string,
  projectName: string,
  statusLabel: string,
): Promise<void> {
  await sendEmail(
    userEmail,
    `Your project ${projectName} — ${statusLabel}`,
    `Hi ${userName},

Your project "${projectName}" has been updated.

Status: ${statusLabel}

View your project:
${config.frontendUrl}/portal/dashboard

— CodeBG`,
  )
}

export async function notifyUserPreviewReady(
  userEmail: string,
  userName: string,
  projectName: string,
  subdomain: string,
  projectId: string,
): Promise<void> {
  await sendEmail(
    userEmail,
    `New preview of ${projectName} is ready`,
    `Hi ${userName},

A new preview of your project "${projectName}" is ready to view:

${config.frontendUrl}/sites/${subdomain}/

Review and leave feedback:
${config.frontendUrl}/portal/projects/${projectId}/review

— CodeBG`,
  )
}

export async function notifyAdminNewFeedback(
  userEmail: string,
  projectSubdomain: string,
  sectionTitle: string,
  description: string,
): Promise<void> {
  await sendEmail(
    config.mailTo,
    `New feedback from ${userEmail} on ${projectSubdomain}`,
    `New feedback on project "${projectSubdomain}":

Section: ${sectionTitle}
From: ${userEmail}

"${description}"

Review in admin panel:
${config.frontendUrl}/admin/feedback`,
  )
}
