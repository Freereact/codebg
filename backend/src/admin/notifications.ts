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

export async function notifyUserPaymentFailed(userEmail: string, userName: string, projectName: string): Promise<void> {
  await sendEmail(
    userEmail,
    `Payment failed for ${projectName}`,
    `Hi ${userName},

Your payment for "${projectName}" has failed. Please update your payment method to keep your site online.

Update your payment method:
${config.frontendUrl}/portal/dashboard

If you need help, reply to this email.

— CodeBG`,
  )
}

export async function notifyUserSubscriptionCancelled(
  userEmail: string,
  userName: string,
  projectName: string,
): Promise<void> {
  await sendEmail(
    userEmail,
    `Your site ${projectName} has been taken offline`,
    `Hi ${userName},

Your subscription for "${projectName}" has ended and the site has been taken offline.

Your project files are still available — you can download them anytime from your dashboard:
${config.frontendUrl}/portal/dashboard

To bring your site back online, start a new subscription from your dashboard.

— CodeBG`,
  )
}

export async function notifyUserSubscriptionCancelScheduled(
  userEmail: string,
  userName: string,
  projectName: string,
  endDate: string,
): Promise<void> {
  await sendEmail(
    userEmail,
    `Your ${projectName} subscription will end on ${endDate}`,
    `Hi ${userName},

Your subscription for "${projectName}" is set to cancel at the end of the current billing period (${endDate}).

Your site will remain online until then. If you change your mind, you can reactivate from your billing settings:
${config.frontendUrl}/portal/dashboard

— CodeBG`,
  )
}

export async function notifyAdminNewPayment(
  userEmail: string,
  projectName: string,
  tier: string,
  amount: string,
): Promise<void> {
  await sendEmail(
    config.mailTo,
    `New payment: ${userEmail} subscribed to ${tier}`,
    `New paying customer!

Email: ${userEmail}
Project: ${projectName}
Plan: ${tier}
Amount: ${amount}

View in admin panel:
${config.frontendUrl}/admin/projects`,
  )
}

export async function notifyAdminBuildFailed(projectName: string, error: string): Promise<void> {
  await sendEmail(
    config.mailTo,
    `Build failed: ${projectName}`,
    `Build failed for project "${projectName}":

${error}

Check the admin panel:
${config.frontendUrl}/admin/projects`,
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
