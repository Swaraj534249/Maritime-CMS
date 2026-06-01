# Backend folder structure

```
backend/
├── aws/                    # S3 + SES SDK — see aws/README.md
├── controllers/            # HTTP only: parse req, call service, send res
├── routes/                 # Express routers + middleware chains
├── middleware/             # Cross-cutting HTTP concerns
├── services/
│   ├── domain/             # Business logic per entity
│   │   ├── candidate.service.js
│   │   ├── candidateFiles.helper.js
│   │   ├── vessel.service.js
│   │   ├── vesselOwner.service.js
│   │   ├── agent.service.js
│   │   └── user.service.js
│   └── email/              # App email (queue, templates) — sends via aws/ses/
├── models/                 # Mongoose schemas
├── utils/                  # Pure helpers
├── errors/                 # AppError
├── uploads/                # Optional legacy local files only (gitignored)
└── index.js                # App entry
```

Project documentation lives in **`/docs`** at repo root.

## Layer rules

| Layer | Responsibility | Should not |
|-------|----------------|------------|
| **routes** | Auth, multer, rate limits, map URL → controller | Contain business rules |
| **controllers** | `asyncHandler`, status codes, `res.json` | Query Mongo directly (prefer services) |
| **domain services** | Validation, tenancy, orchestration | Know about `req.res` |
| **email services** | When to send mail, queue | Know about vessel vs candidate rules |
| **aws/** | S3/SES API calls | Business rules |
| **helpers** (`*Files.helper.js`) | Map multer → document shape | Call HTTP |

## Special folders explained

### `aws/`

All S3 and SES code: clients, upload sync, presign, stream, SES send. See `backend/aws/README.md`.

### `errors/`

`AppError` — throw `new AppError(404, "Not found")` from services; `errorHandler` maps to HTTP JSON.

### `scripts/`

No dedicated `backend/scripts/` directory in this repo. Use `package.json` scripts (`dev`, `start`, `seed`). One-off ops can live in `scripts/` later (migrations, reindex, LocalStack verify).

## Controller thickness (current policy)

| Module | Status | Notes |
|--------|--------|-------|
| `auth.controller.js` | Fat (intentional for now) | Login, OTP, JWT, cookies |
| `agency.controller.js` | Fat (intentional for now) | Agency + admin user creation |
| `candidate.controller.js` | Thin | Delegates to `candidate.service.js` |
| `agent.controller.js` | Thin | Delegates to `agent.service.js` |
| `user.controller.js` | Thin | Delegates to `user.service.js` |
| `vessel.controller.js` | Thin | Delegates to `vessel.service.js` |
| `vesselOwner.controller.js` | Thin | Delegates to `vesselOwner.service.js` |
| `files.controller.js` | Thin | Stream / redirect / presign only |

## Adding a new feature

1. Put business logic in `services/domain/<entity>.service.js`.  
2. Keep controller under ~40 lines.  
3. If it touches S3, reuse `uploadSync` + `*Files.helper.js` + `enrichDeep`.  
4. If it sends email, use `emailNotification.service.js` or `Emails.sendMail`.

## Import path cheat sheet

From `services/domain/foo.service.js`:

```js
const Model = require("../../models/Model");
const { AppError } = require("../../errors/AppError");
const { enrichDeep } = require("../../aws/s3/fileAccess.service");
```

## Alternative folder structures (examples only — no moves planned)

These are common evolutions if the backend grows. Pick one style and stay consistent.

### A) Feature modules (vertical slices) — mapped from today

**Today (horizontal layers):**

```
routes/vesselOwner.route.js
controllers/vesselOwner.controller.js
services/domain/vesselOwner.service.js
services/domain/vesselOwnerFiles.helper.js
models/VesselOwner.js
middleware/upload.js          ← shared by vessel, candidate, vesselOwner
middleware/syncUploadsToS3.js ← shared
```

**Under A, the same code moves into one folder:**

```
backend/modules/vesselOwner/
  vesselOwner.route.js       ← was routes/vesselOwner.route.js
  vesselOwner.controller.js
  vesselOwner.service.js
  vesselOwnerFiles.helper.js
  VesselOwner.model.js
backend/shared/middleware/
  upload.js                  ← still shared (not duplicated per module)
  syncUploadsToS3.js
  VerifyToken.js
  authorization.js
backend/modules/candidate/
  ...
backend/modules/vessel/
  ...
```

`index.js` would mount routers like:

```js
app.use("/vesselOwners", require("./modules/vesselOwner/vesselOwner.route"));
app.use("/candidates", require("./modules/candidate/candidate.route"));
```

**Pros:** Open one folder to work on vessel owners. **Cons:** One move per entity; shared upload/auth must stay in `shared/`.

### B) Hexagonal / ports & adapters

```
backend/src/domain/vesselOwner/
backend/src/application/vesselOwner/
backend/src/adapters/http/
backend/src/adapters/persistence/mongoose/
backend/src/adapters/storage/s3/
```

**Pros:** Testable core, swappable S3/DB. **Cons:** More folders for a medium-sized app.

### C) `src/` + clean entry

```
backend/src/
  app.js
  server.js
  config/
  modules/...
backend/tests/
```

**Pros:** Clear separation from `package.json` / config at root. **Cons:** One-time move of `index.js` and paths.

### D) Keep current layout, add only — mapped from today

**Keep as-is:**

```
controllers/
routes/
services/domain/
services/infrastructure/
models/
middleware/
lib/aws/
utils/
errors/
```

**Add gradually (examples):**

```
validators/
  vesselOwner.schema.js       ← POST/PATCH body validation (optional Zod/Joi)
  candidate.schema.js

jobs/                         ← later, if email queue moves off in-process queue
  email.worker.js
```

Example: extract repeated `VesselOwner.find(...)` blocks into `validators/vesselOwner.schema.js` for request bodies — services keep calling Mongoose directly.

**Pros:** Lowest risk; matches how the repo is already organized. **Cons:** A feature still touches 4–5 folders (routes, controller, service, model, helper).

For Maritime CMS today, **D** is the best default; use **A** only for a large new domain you want isolated from day one.

## Related docs

- [BACKEND_FLOW.md](./BACKEND_FLOW.md)  
- [FILES_AND_S3.md](./FILES_AND_S3.md)  
- [SES.md](./SES.md)  
- [MIDDLEWARE.md](./MIDDLEWARE.md)
