import { clientEnv } from '@/lib/config/env';
import { APP_NAME } from '@/lib/constants';

/**
 * Transactional email templates (Stage 5 §17). Minimal, inline-styled HTML for
 * broad client compatibility. Copy follows the interface voice: plain, direct,
 * action-first. Links are absolute against the public app URL.
 */

interface EmailContent {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#334155;">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
    <h1 style="font-size:20px;color:#020617;margin:0 0 16px;">${title}</h1>
    ${bodyHtml}
    <p style="font-size:12px;color:#64748b;margin-top:32px;">${APP_NAME}</p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">${label}</a>`;
}

export function passwordResetEmail(token: string): EmailContent {
  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
  return {
    subject: 'Reset your password',
    html: layout(
      'Reset your password',
      `<p>We received a request to reset your password. This link expires in 1 hour.</p>
       <p style="margin:24px 0;">${button(url, 'Reset password')}</p>
       <p style="font-size:13px;color:#64748b;">If you didn't request this, you can ignore this email — your password won't change.</p>`,
    ),
    text: `Reset your password: ${url}\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  };
}

export function emailVerificationEmail(token: string): EmailContent {
  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/verify-email/${token}`;
  return {
    subject: 'Verify your email',
    html: layout(
      'Verify your email',
      `<p>Confirm your email address to activate your account.</p>
       <p style="margin:24px 0;">${button(url, 'Verify email')}</p>`,
    ),
    text: `Verify your email: ${url}`,
  };
}

export function inviteEmail(token: string): EmailContent {
  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
  return {
    subject: `You've been invited to ${APP_NAME}`,
    html: layout(
      `Welcome to ${APP_NAME}`,
      `<p>An administrator has invited you. Set your password to get started. This link expires in 7 days.</p>
       <p style="margin:24px 0;">${button(url, 'Set your password')}</p>`,
    ),
    text: `You've been invited to ${APP_NAME}. Set your password: ${url}`,
  };
}
