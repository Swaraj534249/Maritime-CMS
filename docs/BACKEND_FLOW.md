# Backend request flow

How an HTTP request moves through the Maritime CMS backend: **routes → middleware → controllers → services → models → MongoDB**, plus optional infrastructure (S3, SES).

## Entry point: `backend/index.js`

1. Loads **`backend/.env`** via dotenv; exits if `MONGO_URI` or `SECRET_KEY` missing.  
2. Creates Express app, global middleware: rate limit, CORS, JSON, cookies, Morgan.  
3. Serves legacy static files: `GET /uploads/*` from `backend/uploads/`.  
4. Mounts route prefixes (`/auth`, `/users`, `/candidates`, …).  
5. **`errorHandler`** — maps `AppError` to JSON status codes.  
6. Connects MongoDB, listens on `env.PORT`.

## Layer responsibilities

| Layer | Location | Job |
|-------|----------|-----|
| **Routes** | `backend/routes/*.route.js` | URL + HTTP method; middleware chain; call one controller export |
| **Middleware** | `backend/middleware/` | Auth, roles, multer, S3 sync, tenancy injection — see [MIDDLEWARE.md](./MIDDLEWARE.md) |
| **Controllers** | `backend/controllers/` | Thin: `asyncHandler`, call service, `res.json` / status code |
| **Domain services** | `backend/services/domain/` | Business rules, validation, tenancy, orchestration |
| **File helpers** | `backend/services/domain/*Files.helper.js` | Map multer output → MongoDB document shape |
| **Infrastructure** | `backend/services/infrastructure/` | S3, email, presign — see [FILES_AND_S3.md](./FILES_AND_S3.md), [SES.md](./SES.md) |
| **Models** | `backend/models/` | Mongoose schemas (shape of documents in MongoDB) |
**Rule of thumb:** routes know HTTP; services know business; models know persistence shape.

## Example: create vessel owner (with files)

```
POST /vesselOwners
  verifyToken
  authorize(AGENT, AGENCY_ADMIN, SUPER_ADMIN)
  checkAgencyStatus (non–super-admin)
  uploadVesselOwnerFiles      ← multer memory (file.buffer)
  handleMulterError
  syncUploadsToS3             ← PutObject buffer → S3, path = object key
  vesselOwner.controller.create
    vesselOwner.service.create
      vesselOwnerFiles.helper.processUploadedFiles
      VesselOwner.save()      ← MongoDB: path = "vesselowners/tdf4/company_logo-....png"
      enrichDeep(created)     ← BSON-safe JSON + storage flag on files
  res.status(201).json(created)
```

## Example: list vessel owners

```
GET /vesselOwners?page=1&limit=10
  verifyToken, authorize, checkAgencyStatus
  vesselOwner.controller.list
    vesselOwner.service.list
      ListQueryBuilder + VesselOwner.find()
      enrichDeep on each row
  res.json({ data, total, page, ... })
```

No multer on GET. Files are **not** read from disk at list time — only metadata + generated `url` from S3.

## Route map (main prefixes)

| Prefix | Route file | Main entities |
|--------|------------|----------------|
| `/auth` | `auth.route.js` | Login, OTP, signup, password reset |
| `/users` | `user.route.js` | User profile, admin user ops |
| `/agencies` | `agency.route.js` | Agencies |
| `/agents` | `agent.route.js` | Agents |
| `/vesselOwners` | `vesselOwner.route.js` | Vessel owners + uploads |
| `/vessels` | `vessel.route.js` | Vessels + uploads |
| `/candidates` | `candidate.route.js` | Candidates + uploads |
| `/files` | `files.route.js` | Authenticated file access / stream / presign |

All protected routes use **`verifyToken`** (JWT in cookie). Role checks use **`authorize`** from `authorization.js`.

## Controllers: thin vs fat

| Controller | Style | Notes |
|------------|-------|-------|
| `vesselOwner`, `vessel`, `candidate`, `agent`, `user`, `files` | Thin | Delegates to `*.service.js` |
| `auth`, `agency` | Fat (for now) | Auth, OTP, agency creation still contain more logic inline |

New features should follow the **thin controller** pattern.

## Domain services

Each major entity has a `services/domain/<entity>.service.js`:

- Reads `req.user` for tenancy (`agencyId`, role).  
- Uses **`AppError`** for 400/403/404 with consistent JSON.  
- Calls `*Files.helper.js` when `req.files` is present.  
- Returns data passed through **`enrichDeep`** when the response includes file metadata.

## Models

Mongoose models define fields stored in MongoDB (e.g. `VesselOwner`, `Candidate`, `User`). File fields are **objects**, not binary blobs:

```json
{
  "filename": "company_logo-1779135446004-705286012-untitled-design.png",
  "originalName": "Untitled design.png",
  "path": "vesselowners/tdf3/company_logo-1779135446004-705286012-untitled-design.png",
  "mimetype": "image/png",
  "size": 5264905,
  "storage": "s3"
}
```

`path` is the **S3 object key** (folder-like string), not a full `https://` URL. The binary lives in S3; MongoDB stores the pointer + metadata.

## Errors

Services throw **`AppError(statusCode, message)`**. `asyncHandler` forwards rejected promises to **`errorHandler`**, which sends `{ message, code?, ... }` without leaking stack traces in production.

## Frontend consumption

The React app uses **`file.path`** with `getFileURL()` / `useFileDisplayUrl` → `/files/stream` (see [FILES_AND_S3.md](./FILES_AND_S3.md)).

## Related docs

- [MIDDLEWARE.md](./MIDDLEWARE.md)  
- [UTILS.md](./UTILS.md)  
- [FILES_AND_S3.md](./FILES_AND_S3.md)  
- [SES.md](./SES.md)
