# Features: necessary vs optional, scaling, Redis, Zod

## Run model

Frontend + backend on the host, **real AWS** S3 + SES via `backend/.env`. No Docker or LocalStack in this repo.

---

## Feature necessity matrix

| Feature | Necessary? | Why |
|---------|------------|-----|
| **MongoDB** | Yes | All app data |
| **`aws/s3/`** | Yes (if using file uploads) | Storage for logos, docs, photos |
| **`aws/ses/`** or SMTP | Yes (if sending mail) | Auth / welcome emails |
| **`utils/Emails.js`** | Yes | Single `EMAIL_PROVIDER` switch: SES vs SMTP (Hostinger) |
| **`services/email/` queue** | Recommended | Keeps API fast; not Redis |
| **`services/email/` templates** | Recommended | Maintainable HTML |
| **`enrichDeep` + presigned image URLs** | Recommended | Fast table logos without streaming through API |
| **`/files/stream` / `/files/access`** | Recommended | PDFs + fallback when presign missing |
| **`emailQueue` (in-process)** | Optional at tiny scale | Could `await sendMail` directly; queue is cleaner |
| **Redis** | **Not needed now** | See below |
| **Zod env validation** | **Not required** | See below |
| **Logo resize (`imageOptimize`)** | Recommended | 5MB logos → ~20–80KB for tables |

---

## Many users uploading at the same time

**Current design:** Each upload holds file bytes in RAM (max 10MB/file) until S3 `PutObject` finishes.

| Risk | Mitigation |
|------|------------|
| RAM spikes | Keep 10MB limit; resize logos (done); rate limit API (`middleware/rateLimit.js`) |
| Slow API | Already uploads after multer in same request — consider async queue later |
| S3 throttling | Rare at CMS scale; AWS raises limits automatically |

**Services / patterns (when you outgrow single server):**

1. **Presigned PUT/POST to S3** (best) — browser uploads direct to S3; your API only issues a short URL. No file bytes on server. See [presigned URLs](#presigned-urls-explained) below.  
2. **SQS + worker** — API enqueues job; worker uploads to S3 (like email queue, but for files).  
3. **AWS Lambda** on S3 events — virus scan, thumbnails.  
4. **Multer → disk temp** — lowers RAM, adds disk I/O (what you had before).

For **expected CMS traffic** (even dozens of concurrent users), current setup + logo resize + rate limits is **fine**.

---

## Presigned URLs explained

| Term | Meaning | You have it? |
|------|---------|--------------|
| **Presigned GET URL** | Temporary link to **download** a private S3 object. Used for table logos (`enrichDeep` → `file.url`) and PDF open (`/files/access`). | **Yes** |
| **Presigned PUT URL** | Browser **uploads** straight to S3; API only issues URL. | **Yes** — vessel owners (`POST /files/presign-upload` + PUT) |
| **Presigned POST** | Form POST with policy fields (alternative to PUT). | **No** — PUT is enough |

**Candidates / vessels** still use multer → `uploadSync` (API holds buffer briefly). Migrate them the same way when needed.

**Presigned image URLs** = presigned GET for `image/*` — what `FileAvatar` uses via `company_logo.url`.

---

## Redis — do you need it?

**Not for this project today.**

| Use case | What you have instead |
|----------|------------------------|
| Session store | JWT in httpOnly cookie |
| Email queue | `emailQueue.service.js` in-process |
| Cache presigned URLs | URLs generated per list request; cheap for small pages |
| Cache images | Browser cache + S3 + lazy loading |

**When Redis would help:** multiple API servers behind a load balancer (shared sessions/queue), or heavy repeated presign of same keys. Add then — not before you measure a problem.

---

## Zod / env validation — do you need it?

**Not required** for a low-traffic internal CMS.

| Without Zod | Impact for “few users at a time” |
|-------------|----------------------------------|
| Typo in `MONGO_URI` | Server fails on connect — you fix `.env` once |
| Wrong bucket name | Upload errors in logs |
| Missing `SECRET_KEY` | **Caught** — `index.js` exits at startup |

**When to add Zod back:** multiple deploy environments (staging/prod), many env vars, or a team that often misconfigures `.env`. One file `loadEnv.js` — no architectural change.

**Few concurrent users does not change** the Zod decision; **deployment complexity** does.

---

## Table logos — optimization summary

| Technique | Status | Effect |
|-----------|--------|--------|
| Resize on upload (`company_logo` only) | Implemented | ~5MB → small JPEG |
| Presigned URL in list API | Implemented | Browser loads S3 directly |
| `loading="lazy"` on `FileAvatar` | Implemented | Off-screen rows wait |
| In-memory stream cache | Implemented | No duplicate stream for same path |
| Redis | Not implemented | Unnecessary at current scale |
| CloudFront CDN | Optional later | Faster repeat loads globally |

**You will still see one network request per logo** — that is the browser loading each image. Goal is each request being **small and direct to S3**, not through your API.

---

## Environment knobs (logo size)

```env
LOGO_MAX_WIDTH_PX=256
LOGO_JPEG_QUALITY=85
```

Only affects fields in `aws/s3/imageOptimize.js` (`company_logo` today).
