# Managed services vs self-written code (reference only)

Not implemented — use this when you want less custom AWS/middleware code.

## What you already use (industry standard)

| Area | Your code | Industry norm |
|------|-----------|---------------|
| Object storage | `aws/s3/*` + AWS SDK | **AWS S3** (correct) |
| Transactional email | `aws/ses/*` + `utils/Emails.js` | **AWS SES** or **Resend** / **SendGrid** |
| Database | Mongoose + MongoDB Atlas | **MongoDB Atlas** (correct) |
| Auth | JWT in cookies + your middleware | **Auth0**, **Clerk**, **Firebase Auth** (optional) |

Your AWS folder is normal for a Node API on S3/SES. SDK + presign + multer is how most teams start.

---

## Could replace or simplify your code

### File uploads & images

| Service | Free tier / cost | Could replace | Notes |
|---------|------------------|---------------|-------|
| **AWS S3** (keep) | Pay per GB | — | Stay on S3; bucket is the standard store |
| **S3 presigned PUT/POST** (keep, extend) | Same as S3 | `uploadSync` + multer buffer on API | Browser uploads direct to S3; API only issues URL — less RAM/code |
| **Cloudinary** | Generous free tier | `imageOptimize.js`, presign, `/files/stream` for images | Upload widget, resize, CDN URL in one URL — less sharp/S3 image logic |
| **Uploadcare** | Free tier | Multer + S3 upload path | Hosted upload + transformations |
| **imgix** / **CloudFront** | Paid | `enrichDeep` presign churn | CDN in front of S3 — faster logos, cache at edge |

**Best next step for scale:** presigned **PUT** to S3 (still AWS, less custom upload code). **Cloudinary** if you want almost no image backend code.

### Email

| Service | Free tier | Could replace | Notes |
|---------|-----------|---------------|-------|
| **AWS SES** (keep) | Very cheap | — | Good if already on AWS |
| **Resend** | Free tier, simple API | `aws/ses/`, `utils/Emails.js` | One HTTP call, great DX |
| **SendGrid** | Free tier | Same | Templates + analytics |
| **Postmark** | Trial | Same | Strong deliverability |
| **Brevo (Sendinblue)** | Free tier | Same | Marketing + transactional |

**Could replace:** `emailQueue` + `sendEmail.service` with **Resend SDK** + their queue/webhooks — fewer AWS SES sandbox headaches.

### Auth & users

| Service | Could replace |
|---------|---------------|
| **Auth0** / **Clerk** / **Supabase Auth** | `auth.controller.js`, JWT cookie logic, `VerifyToken`, `authorization` |
| **Firebase Auth** | Same + frontend login UI |

Trade-off: monthly cost, less control, faster social login / MFA.

### Background jobs

| Service | Could replace |
|---------|---------------|
| **BullMQ + Redis** (self-host or **Upstash Redis**) | `emailQueue.service.js` — reliable email retries |
| **Inngest** / **Trigger.dev** | Queues + scheduled jobs without maintaining Redis |
| **AWS SQS + Lambda** | Upload processing, email send workers |

**When:** multiple API servers or failed emails must retry.

### API / platform

| Service | Use |
|---------|-----|
| **Vercel** / **Railway** / **Render** | Host backend + frontend — no Docker needed |
| **MongoDB Atlas** | Already typical |
| **Sentry** | Error monitoring — free tier |
| **Datadog** / **Better Stack** | Logs/metrics — later |

### Caching

| Service | Could replace |
|---------|---------------|
| **Redis (Upstash)** | Presign cache, rate limits, sessions |
| **CloudFront** | Repeated S3 logo downloads |

**For your traffic:** not required yet ([FEATURES_AND_SCALING.md](./FEATURES_AND_SCALING.md)).

---

## Common production stack (maritime / B2B CMS)

| Layer | Common choice |
|-------|----------------|
| Frontend | React on **Vercel** or **S3 + CloudFront** |
| API | Node on **Railway** / **ECS** / **Lambda** |
| DB | **MongoDB Atlas** |
| Files | **S3** + **CloudFront** |
| Email | **SES** or **Resend** |
| Auth | Custom JWT or **Clerk** |
| Errors | **Sentry** |
| CI | **GitHub Actions** |

---

## What not to outsource early

- **Domain services** (`vesselOwner.service.js`, etc.) — your business rules  
- **Tenancy** (`agencyId`, `authorize`) — app-specific  
- **Mongoose models** — your schema  

Managed services replace **infrastructure glue**, not your CMS logic.
