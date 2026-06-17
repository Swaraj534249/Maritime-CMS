# Utils reference

`backend/utils/` holds **small, reusable helpers** with no Express `req/res` and no heavy infrastructure. Prefer domain services for business rules.

## `fileRef.js`

Classifies paths stored in MongoDB:

| Function | Purpose |
|----------|---------|
| `isS3ObjectKey(path)` | `vesselowners/tdf3/file.png` → true |
| `isLocalUploadPath(path)` | Absolute path or contains `/uploads/` → true |
| `toLocalUploadUrl(path)` | Normalizes to `/uploads/...` for static middleware |
| `isFileMetadata(obj)` | Has `filename` + `path` → treat as file blob in `enrichDeep` |

Used by `fileAccess.service.js`, `upload.js` delete, `files.controller.js`.

## `Emails.js`

Facade: **`sendMail(to, subject, html)`** → SES or SMTP based on `EMAIL_PROVIDER`.  
See [SES.md](./SES.md).

## `GenerateToken.js`

JWT helpers for login cookies and short-lived reset tokens.

## `GenerateOtp.js`

OTP generation/validation helpers used in auth flows.

## `SanitizeUser.js`

Strips sensitive fields before putting user data in a JWT or API response.

## `ListQueryBuilder.js`

Builds MongoDB filter/sort/pagination from query string (`page`, `limit`, `search`, `sort`, filters). Used by list endpoints in domain services.

## `ListResponseBuilder.js`

Shapes list API responses (`data`, `total`, `page`, `totalPages`, etc.) consistently.

## `ResumeParser.js`

Parses uploaded resume files (PDF/DOC) for candidate auto-fill — used by candidate routes that accept resume upload.

## What is *not* in utils

| Concern | Location |
|---------|----------|
| S3 upload/download | `aws/s3/` |
| Presigned URLs | `s3Storage.service.js`, `fileAccess.service.js` |
| Email HTML templates | `services/infrastructure/email/templates/` |
| HTTP errors | `errors/AppError.js` + `middleware/errorHandler.js` |

## Frontend utils

`frontend/src/utils/fileUtils.js` mirrors `fileRef` ideas for the browser: `isS3Key`, `getFileURL`, icons for PDF/DOC. Works with **`file.url`** from API when present.
