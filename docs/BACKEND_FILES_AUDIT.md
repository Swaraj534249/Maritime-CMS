# Backend file audit — necessity and flow


---
## `services/domain/`
| File | Verdict | Role |
|------|---------|------|
| `*.service.js` | ✅ | Business logic per entity |
| `*Files.helper.js` | ✅ | Map uploads → MongoDB file shape |
---
## `services/email/`
| File | Verdict | Role |
|------|---------|------|
| `emailNotification.service.js` | 🟡 | Welcome / password emails |
| `emailQueue.service.js` | 🟡 | Async send (in-process, not Redis) |
| `passwordSetupLink.service.js` | 🟡 | Reset token in DB |
| `templates/userLifecycle.templates.js` | 🟡 | HTML |
Could inline into controllers later — **not urgent to delete**.
---
## `middleware/`
| File | Verdict | Role |
|------|---------|------|
| `VerifyToken.js` | ✅ | JWT cookie |
| `authorization.js` | ✅ | Roles, agency |
| `upload.js` | ✅ | Multer + deleteFile + key helpers |
| `uploadRules.js` | ✅ | S3 folder naming |
| ~~`syncUploadsToS3.js`~~ | — | Removed — all entities use presigned PUT |
| `applyPresignedUploads.js` | ✅ | Parses `s3_uploads` on vessel owner |
| `asyncHandler.js` | ✅ | Async errors |
| `errorHandler.js` | ✅ | JSON errors |
| `rateLimit.js` | 🟡 | Abuse protection |
| `autoInjectTenantData.js` | 🟡 | Injects `agencyId` on POST |
| `requireSelfOrSuperAdmin.js` | 🟡 | User profile guard |
---
## `models/`
| File | Verdict | Role |
|------|---------|------|
| All `models/*.js` | ✅ | Mongoose schemas |
---
---
## `errors/`, `database/`
| File | Verdict | Role |
|------|---------|------|
| `errors/AppError.js` | ✅ | HTTP errors |
| `database/db.js` | ✅ | Mongo connect |
---
## Root misc
| File | Verdict | Role |
|------|---------|------|
| `package.json` | ✅ | Dependencies |
| `.env.example` | ⚪ | Template |
| `env` | ⚪ | Optional second env file |
| `uploads/` | ⚪ | Legacy local files only |
| ~~`vercel.json`~~ | ❌ Removed | Old Vercel deploy config, not wired to app |
---
## What you could remove later (weak case only)
| Item | Case for removal | Recommendation |
|------|------------------|----------------|
| ~~`syncUploadsToS3` + multer path~~ | — | Removed |
| ~~`imageOptimize.js`~~ | — | Removed; logos resize in browser (`s3PresignedUpload.js`) |
| `emailQueue` | Low traffic | Keep — tiny and helpful |
| `uploads/` static | No new local files | Keep until DB has no local paths |
| `ResumeParser` | No resume upload feature | Keep if feature used |
---
## Redis
**Not implemented.** Not necessary until multiple API servers or heavy caching. See [FEATURES_AND_SCALING.md](./FEATURES_AND_SCALING.md).