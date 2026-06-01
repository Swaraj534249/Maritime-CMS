# Files and S3

> **Tenancy & upload order:** See [TENANCY_AND_UNIQUENESS.md](./TENANCY_AND_UNIQUENESS.md) — files upload **after** `POST /candidates` (etc.) succeeds; S3 key = `{agencyShortName|agencyName}/{entityType}/{businessKey}/{filename}` (from JWT).

> **Diagrams:** [DATA_FLOWS.md](./DATA_FLOWS.md)

## Summary

Files live in **S3**. MongoDB stores the **object key** in `path`. Binary data is never stored in MongoDB.

## Upload flow (all entities)

| Step | What |
|------|------|
| 1 | `POST /candidates` (or `/vesselOwners`, `/vessels`) — **no files**; tenant uniqueness validated |
| 2 | `POST /files/upload` per file → `uploadKey.service.js` → S3 (tenant = JWT `agencyShortName` or `agencyName`) |
| 3 | `PATCH /:id` with `s3_uploads` JSON → `applyPresignedUploads.js` → `*Files.helper.js` |

Frontend: `entitySubmitWithFiles.js` orchestrates steps 1–3.  
Parse resume: **parse only** on `POST /candidates/parse-resume`; resume uploads in step 2 like other docs.

Optional: `POST /files/presign-upload` + browser PUT (requires S3 bucket CORS; not used by default UI).

## Fetch / display

| Scenario | Path |
|----------|------|
| Table logo | `enrichDeep` → presigned GET `url` → `FileAvatar` (lazy) |
| PDF | `/files/access` |
| Fallback | `/files/stream` |

## Env

```env
S3_BUCKET_NAME=...
S3_PRESIGN_EXPIRES_SECONDS=3600
S3_PRESIGN_UPLOAD_EXPIRES_SECONDS=900
```

## IAM

Bucket policy + user: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`.
