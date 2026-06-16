# Email (SES / SMTP)

> **Full file-by-file diagram:** [DATA_FLOWS.md](./DATA_FLOWS.md#ses--sending-one-email)

## Summary

Mail never goes from controllers straight to AWS. It always goes through **`utils/Emails.js`**, which calls either **`aws/ses/sendEmail.service.js`** or Gmail SMTP.

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

```env
EMAIL_PROVIDER=ses
SES_FROM_EMAIL=verified@yourdomain.com
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Adding a new email

1. Template in `services/email/templates/`.  
2. Function in `emailNotification.service.js` using `enqueueEmailJob(() => sendMail(...))`.  
3. Call from domain service after DB success.

Do not import `@aws-sdk/client-ses` outside `aws/ses/`.
