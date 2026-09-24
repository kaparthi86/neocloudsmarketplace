/**
 * Outbound mail — Resend HTTPS API or a generic JSON webhook.
 * Operator inbox still records every inbound message when mail is off.
 */

export function isMailConfigured() {
  if (process.env.NEO_MAIL_WEBHOOK_URL) return true;
  return Boolean(process.env.RESEND_API_KEY && process.env.NEO_MAIL_FROM);
}

export async function sendMail({ to, subject, text }) {
  if (process.env.NEO_MAIL_WEBHOOK_URL) {
    const res = await fetch(process.env.NEO_MAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text }),
    });
    if (!res.ok) return { sent: false, reason: `webhook_${res.status}` };
    return { sent: true, via: 'webhook' };
  }
  if (process.env.RESEND_API_KEY && process.env.NEO_MAIL_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NEO_MAIL_FROM,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) return { sent: false, reason: `resend_${res.status}` };
    return { sent: true, via: 'resend' };
  }
  return { sent: false, reason: 'mail_not_configured' };
}

export async function notifyOperator({ subject, text }) {
  if (!isMailConfigured()) return { sent: false, reason: 'mail_not_configured' };
  const to = process.env.NEO_OPERATOR_EMAIL || process.env.NEO_MAIL_FROM || 'operator@localhost';
  return sendMail({ to, subject, text });
}

export function inboundSavedMessage(emailed) {
  if (emailed) {
    return 'Saved in the operator inbox and emailed to the operator. This does not create a live reservation or enable payouts.';
  }
  return 'Saved in the operator inbox. Email delivery is not configured on this server, so the operator reads it at /admin. This does not create a live reservation or enable payouts.';
}

export function verifyUrl(token) {
  const domain = process.env.CANONICAL_DOMAIN || 'neocloudsmarketplace.com';
  const base = process.env.PUBLIC_BASE_URL || `https://${domain}`;
  return `${base.replace(/\/$/, '')}/v1/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function sendAccountKeyEmail(account, reason) {
  if (!isMailConfigured()) return { sent: false, reason: 'mail_not_configured' };
  const verify = account.verify_token ? `\n\nConfirm this email:\n${verifyUrl(account.verify_token)}\n` : '';
  const text = [
    `Neo Clouds API key (${reason}).`,
    '',
    `Role: ${account.role}`,
    `Key: ${account.api_key}`,
    verify,
    'Save this key. Reservations stay tied to it.',
    'Payments are not collected.',
  ].join('\n');
  return sendMail({
    to: account.email,
    subject: `Your Neo Clouds API key (${reason})`,
    text,
  });
}
