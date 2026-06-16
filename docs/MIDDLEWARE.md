# Middleware reference

Middleware runs **in order** on each route. Files live in `backend/middleware/`.

## Global (in `index.js`)

| Middleware | File | Purpose |
|------------|------|---------|
| API rate limit | `rateLimit.js` → `apiLimiter` | 300 requests / 15 min per IP |
| CORS | `index.js` | `ORIGIN` from env, credentials + `X-Total-Count` |
| `express.json()` | — | Parse JSON bodies |
| `cookieParser` | — | Read JWT cookie |
| `morgan` | — | Request logging |
| Static `/uploads` | `index.js` | Legacy local files only |
| `errorHandler` | `errorHandler.js` | Last — catches errors from all routes |

## Per-route (typical protected resource)

Order matters. Example from `vesselOwner.route.js`:

```
verifyToken → authorize(...) → checkAgencyStatus → [upload → handleMulterError → syncUploadsToS3] → controller
```

### `VerifyToken.js` — `verifyToken`

- Reads JWT from **`req.cookies.token`**.  
- Verifies with `SECRET_KEY`, sets **`req.user`** (`_id`, `email`, `role`, `agencyId`, `industryType`).  
- 401 if missing/invalid/expired.

### `authorization.js`

| Export | Purpose |
|--------|---------|
| `authorize(...roles)` | 403 if `req.user.role` not in list |
| `requireSuperAdmin` | Shorthand for super admin only |
| `requireAgencyAdmin` | Super admin or agency admin |
| `requireAgent` | Super admin, agency admin, or agent |
| `checkAgencyAccess` | Ensures `agencyId` in request matches user's agency (super admin bypass) |
| `checkAgencyStatus` | Blocks agents if agency is inactive/suspended |

### `requireSelfOrSuperAdmin.js`

Used on user profile routes: param `:id` must match `req.user._id` unless super admin.

### `autoInjectTenantData.js`

On POST/PATCH, injects **`agencyId`**, **`createdBy`**, **`industryType`** from the JWT so clients cannot spoof another tenant.

### `upload.js` + `uploadRules.js`

| Export | Purpose |
|--------|---------|
| `uploadVesselOwnerFiles` | Multer fields: logo, contract, license |
| `uploadVesselFiles` | Vessel image + documents |
| `uploadCandidateFiles` | Candidate photo + document fields |
| `handleMulterError` | Friendly 400 for size/type errors |
| `deleteFile` | Delete local path or S3 key |

**Multer** uses **memory storage** (`file.buffer`); `syncUploadsToS3` uploads directly to S3. See [FILES_AND_S3.md](./FILES_AND_S3.md).

`uploadRules.js` maps `uploadFolder` (e.g. `vesselowners`) to which body field names the subfolder (e.g. `company_shortname`). S3 keys are `{agencyShortName|agencyName}/{folder}/{subfolder}/{filename}` — see [FILES_AND_S3.md](./FILES_AND_S3.md).

### `syncUploadsToS3.js` — `syncUploadsToS3`

After multer, uploads each temp file to S3, sets `file.path` to the object key, deletes local temp file. Skips if `S3_BUCKET_NAME` unset (warns in console).

### `asyncHandler.js`

Wraps `async (req,res,next) => ...` so `throw` / rejected promises reach `errorHandler`.

### `rateLimit.js` — `authLimiter`

Stricter limit on `/auth/*`: 30 requests / 15 min.

## Auth route stack

`/auth` uses **`authLimiter`** only (no `verifyToken` on login/signup). `check-auth` uses `verifyToken` on that single route.

## Files route stack

`/files/*` uses **`verifyToken`** only — no role check. Any logged-in user with a valid path can stream/presign (path must be a valid S3 key or legacy local path).

## When adding a new upload route

1. Add multer fields in `upload.js` if needed.  
2. Chain: `uploadX`, `handleMulterError`, **`syncUploadsToS3`**, then controller.  
3. In domain service, use `*Files.helper.js` and **`enrichDeep`** on responses.
