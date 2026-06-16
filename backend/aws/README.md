# `backend/aws/` — function reference

AWS SDK clients and S3/SES helpers. Email templates live in `services/email/`.

## `env.js`

| Function | What it does |
|----------|----------------|
| `getAwsEndpoint()` | Returns `process.env.AWS_ENDPOINT_URL` (trimmed) or `undefined`. Used for LocalStack; real AWS leaves this unset. |
| `getSesFromEmail()` | Returns `SES_FROM_EMAIL` or falls back to `EMAIL` — the From address for SES. |
| `isLocalAws()` | `true` when `AWS_ENDPOINT_URL` is set (LocalStack / custom endpoint). |

**Why not inline in `index.js`?** These helpers are imported by `clients.js`, `ses/sendEmail.service.js`, and startup logging. Keeping them in one file avoids duplicating the same `process.env` reads across the AWS layer. You *could* merge them into `clients.js`, but they do not belong only in `index.js`.

---

## `clients.js`

| Function | What it does |
|----------|----------------|
| `baseClientConfig()` | Builds shared SDK config: region, credentials, optional custom endpoint. |
| `getS3Client()` | Lazy singleton `S3Client`. Uses path-style URLs when a custom endpoint is set (LocalStack). |
| `getSesClient()` | Lazy singleton `SESClient`. |

---

## `s3/storage.service.js`

| Function | What it does |
|----------|----------------|
| `buildObjectKey(tenantKey, folderName, subFolderName, filename)` | Joins path segments into one S3 key, e.g. `srja/candidates/indos123/passport-….pdf`. |
| `uploadFile({ key, body, contentType })` | `PutObject` to `S3_BUCKET_NAME`. |
| `uploadBuffer(buffer, key, contentType)` | Convenience wrapper around `uploadFile`. |
| `deleteObject(key)` | `DeleteObject` from the bucket. |
| `getPresignedUploadUrl(key, contentType, expiresInSeconds?)` | Presigned **PUT** URL so the browser can upload directly to S3. |
| `getPresignedDownloadUrl(key, expiresInSeconds?)` | Presigned **GET** URL for temporary download/view. |

---

## `s3/uploadKey.service.js`

| Function | What it does |
|----------|----------------|
| `validateUploadMeta(...)` | Ensures fieldname, originalName, contentType exist; MIME is allowed; size ≤ 10 MB. |
| `buildUploadMeta(...)` | Normalizes metadata returned to the client (`key`, `filename`, `mimetype`, `storage: "s3"`, etc.). |
| `uploadFileToS3(req, { buffer, fieldname, ... })` | Resolves tenant folder from JWT + form fields, builds key, uploads buffer, returns metadata. Used by `POST /files/upload`. |

---

## `s3/presignUpload.service.js`

| Function | What it does |
|----------|----------------|
| `createPresignedPutUpload(req, body)` | Same key resolution as `uploadFileToS3`, but returns a presigned PUT URL instead of uploading server-side. Optional path when bucket CORS allows browser PUT. |

---

## `s3/fileAccess.service.js`

| Function | What it does |
|----------|----------------|
| `resolveAccessUrl(filePath)` | Presigned GET URL for an S3 key, or `null` if invalid. Used by `/files/access` redirect. |
| `isImageFile(file)` | True for image MIME types or common image extensions. |
| `enrichFileMetadata(file)` | Adds `storage: "s3"` and presigned `url` for **images only** (list avatars). |
| `enrichDeep(value)` | Walks a document/array recursively; presigns image file objects. Used in list/detail API responses. |

---

## `s3/objectStream.js`

| Function | What it does |
|----------|----------------|
| `getS3ObjectStream(key)` | `GetObject` from S3; returns the SDK response (stream/body). Used by `/files/stream` to pipe bytes through the API (works in `<img>` tags where redirects fail). |

---

## `ses/sendEmail.service.js`

| Function | What it does |
|----------|----------------|
| `sendSesEmail({ to, subject, html, text, replyTo, cc })` | Simple HTML email via SES `SendEmailCommand`. Uses raw MIME when `cc` is present. |
| `sendSesRawEmail({ to, cc, subject, html, replyTo, attachments })` | Builds MIME with `nodemailer/mail-composer` and sends via `SendRawEmailCommand` (supports attachments + CC). |

---

## Related (not in `aws/` but part of the flow)

| File | Role |
|------|------|
| `middleware/upload.js` | Tenant key helpers, `parseFormFields`, resume multer |
| `middleware/applyPresignedUploads.js` | Parses `s3_uploads` JSON on PATCH |
| `controllers/files.controller.js` | `/files/access`, `/files/stream`, `/files/upload` |

## Upload flow (summary)

1. Frontend saves entity (no files) → backend validates tenant uniqueness.
2. Files upload via presigned PUT or `POST /files/upload`.
3. Frontend PATCHes entity with `s3_uploads` JSON metadata.
4. Domain `*Files.helper` merges file metadata into MongoDB `path` fields (S3 keys).

All stored paths are S3 keys; clients use `/files/stream` or `/files/access` to open files.
