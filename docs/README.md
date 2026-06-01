# Maritime CMS documentation

All docs in `/docs` at the repo root.

## Start here

| Doc | Read when |
|-----|-----------|
| [DATA_FLOWS.md](./DATA_FLOWS.md) | SES + S3 file-by-file flows |
| [FEEDBACK.md](./FEEDBACK.md) | Feedback / ticketing — user guide and code flow |
| [FEATURES_AND_SCALING.md](./FEATURES_AND_SCALING.md) | What's required, uploads, Redis, Zod, logos |
| [SERVICES_AND_ALTERNATIVES.md](./SERVICES_AND_ALTERNATIVES.md) | Managed services that could reduce custom code |
| [TENANCY_AND_UNIQUENESS.md](./TENANCY_AND_UNIQUENESS.md) | Multi-tenant model, onboarding, per-agency uniqueness, upload order |
| [BACKEND_FILES_AUDIT.md](./BACKEND_FILES_AUDIT.md) | Every backend file — required or not |
| [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) | Folder layout (`aws/`, services, middleware) |
| [BACKEND_FLOW.md](./BACKEND_FLOW.md) | Routes → controllers → services |
| [CONFIG_AND_ENV.md](./CONFIG_AND_ENV.md) | `backend/.env` |

## AWS

| Doc | Topic |
|-----|--------|
| [FILES_AND_S3.md](./FILES_AND_S3.md) | Upload, presigned URLs, logos |
| [SES.md](./SES.md) | Email paths |
| `backend/aws/README.md` | Short description of each AWS file |

## Reference

| Doc | Topic |
|-----|--------|
| [MIDDLEWARE.md](./MIDDLEWARE.md) | Auth, multer, rate limits |
| [UTILS.md](./UTILS.md) | Helpers |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | Email queue vs `aws/` |

## Run locally (real AWS)

1. Copy `backend/.env.example` → `backend/.env` (Mongo, JWT, S3 bucket, SES).  
2. `cd backend && npm install && npm run dev`  
3. `cd frontend && npm start`  

No Docker or LocalStack required.
