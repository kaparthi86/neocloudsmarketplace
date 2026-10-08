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

export const DEFAULT_INVESTOR_EMAIL = 'investorsneoclouds@googlegroups.com';

export function investorEmail() {
  return process.env.NEO_INVESTOR_EMAIL || DEFAULT_INVESTOR_EMAIL;
}

export async function notifyOperator({ subject, text, to }) {
  if (!isMailConfigured()) return { sent: false, reason: 'mail_not_configured' };
  const dest = to || process.env.NEO_OPERATOR_EMAIL || process.env.NEO_MAIL_FROM || 'operator@localhost';
  return sendMail({ to: dest, subject, text });
}

export function emailCustomer(to, { subject, text }) {
  if (!to || !isMailConfigured()) return;
  sendMail({ to, subject, text }).catch(err => {
    console.error('customer mail failed:', err.message);
  });
}

export function inboundSavedMessage(emailed) {
  if (emailed) {
    return 'Saved in the operator inbox and emailed to the operator. This does not create a live reservation or enable payouts.';
  }
  return 'Saved in the operator inbox. Email delivery is not configured on this server, so the operator reads it at /admin. This does not create a live reservation or enable payouts.';
}

export async function sendAccountKeyEmail(account, reason) {
  if (!isMailConfigured()) return { sent: false, reason: 'mail_not_configured' };
  const text = [
    `Neo Clouds API key (${reason}).`,
    '',
    `Role: ${account.role}`,
    `Key: ${account.api_key}`,
    '',
    'Save this key. Reservations stay tied to it.',
    'Payments are not collected.',
  ].join('\n');
  return sendMail({
    to: account.email,
    subject: `Your Neo Clouds API key (${reason})`,
    text,
  });
}
