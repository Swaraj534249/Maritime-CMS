# Email (SES / SMTP)

> **Full file-by-file diagram:** [DATA_FLOWS.md](./DATA_FLOWS.md#ses--sending-one-email)

## Summary

Mail never goes from controllers straight to AWS. It always goes through **`utils/Emails.js`**, which calls either **`aws/ses/sendEmail.service.js`** (Amazon SES) or an **SMTP provider** via nodemailer. The active path is chosen by `EMAIL_PROVIDER`.

## Provider switch (`EMAIL_PROVIDER`)

| Value | Path | When to use |
|-------|------|-------------|
| `ses` | Amazon SES (`aws/ses/sendEmail.service.js`) | Best for production; **requires SES production access** (in Sandbox you can only send to verified recipients) |
| anything else, e.g. `smtp` | nodemailer SMTP (`SMTP_HOST` + `EMAIL`/`PASSWORD`); falls back to Gmail service if `SMTP_HOST` is unset | Send to any recipient immediately (no SES sandbox limits) |

Switching between SES and SMTP is a **one-line** change to `EMAIL_PROVIDER` — the `SES_*` and `SMTP_*` variables can coexist in the same `.env`. The app currently runs on **Hostinger SMTP** (`admin@tursaile.in`) while SES production access is pending.

## Sender identities

Both providers use the same two identities (see `services/email/mailIdentities.js`):

| Identity | Env var | Used for |
|----------|---------|----------|
| Default From (`noreply@tursaile.in`) | `SES_FROM_EMAIL` | All automated mail (OTP, password reset, welcome, proposal/vacancy/sailing) |
| Admin From (`admin@tursaile.in`) | `SES_ADMIN_FROM_EMAIL` | Mail where the **super admin** is the sender (agency-admin welcome, feedback resolved/reminder) |
| Default Reply-To (`support@tursaile.in`) | `MAIL_REPLY_TO` | Replies when a send sets no explicit reply address |
| Feedback inbox (`admin@tursaile.in`) | `FEEDBACK_NOTIFY_EMAIL` | **Receives** feedback submissions + reopen alerts |
| Monitoring BCC (`support@tursaile.in`) | `SUPPORT_BCC_EMAIL` | Temporary blind copy on agent/agency mail; clear the var to disable |

Under SMTP the account authenticates as `admin@tursaile.in`; `noreply@`/`support@` are aliases of that mailbox.

## File roles

| File | Necessary? | Role |
|------|------------|------|
| `aws/ses/sendEmail.service.js` | Yes (if SES) | Only file that calls SES API |
| `aws/clients.js` | Yes | `SESClient` singleton |
| `aws/env.js` | Yes | `getSesFromEmail()`, LocalStack endpoint |
| `utils/Emails.js` | Yes | `EMAIL_PROVIDER` switch |
| `services/email/emailNotification.service.js` | Recommended | Welcome / password-change orchestration |
| `services/email/emailQueue.service.js` | Recommended | Non-blocking send after HTTP response |
| `services/email/passwordSetupLink.service.js` | Yes for welcome flow | DB token for reset link |
| `services/email/templates/*.js` | Recommended | HTML bodies |

## Flow (welcome email)

```
agent.service.js
  → emailNotification.prepareAndQueueAgentWelcome()
    → passwordSetupLink.service.js (MongoDB token)
    → templates/userLifecycle.templates.js (HTML)
    → emailQueue.enqueueEmailJob()
      → [after response] utils/Emails.sendMail()
        → aws/ses/sendEmail.service.js
          → aws/clients.getSesClient()
            → AWS SES
```

## Flow (forgot password)

```
auth.controller.js
  → utils/Emails.sendMail()  (awaits — no queue)
    → aws/ses/sendEmail.service.js
      → AWS SES
```

## Configuration

SES mode:

```env
EMAIL_PROVIDER=ses
SES_FROM_EMAIL=Tursaile <noreply@tursaile.in>
SES_ADMIN_FROM_EMAIL=Tursaile Admin <admin@tursaile.in>
MAIL_REPLY_TO=support@tursaile.in
FEEDBACK_NOTIFY_EMAIL=admin@tursaile.in
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

SMTP mode (Hostinger) — keep the same identity vars above and add:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465          # 465 = implicit SSL (SMTP_SECURE=true); 587 = STARTTLS
SMTP_SECURE=true
EMAIL=admin@tursaile.in           # SMTP login user
PASSWORD=<mailbox password>       # SMTP login password
```

> Deliverability: when sending via SMTP, the domain DNS must authorize the SMTP provider (SPF + DKIM, ideally DMARC), otherwise mail may land in spam.

## Adding a new email

1. Template in `services/email/templates/`.  
2. Function in `emailNotification.service.js` using `enqueueEmailJob(() => sendMail(...))`.  
3. Call from domain service after DB success.

Do not import `@aws-sdk/client-ses` outside `aws/ses/`.
