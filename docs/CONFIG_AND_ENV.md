# Configuration (`backend/.env`)

| File | Purpose |
|------|---------|
| `backend/.env` | **Your secrets** — used at runtime |
| `backend/.env.example` | Safe template — copy to `.env` |

Loaded in `index.js` via dotenv. Startup requires `MONGO_URI` and `SECRET_KEY`.

## Real AWS (typical)

```env
MONGO_URI=...
SECRET_KEY=...
ORIGIN=http://localhost:3000
PORT=8000

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=maritime-cms-dev-upload

EMAIL_PROVIDER=ses
SES_FROM_EMAIL=verified@yourdomain.com

S3_PRESIGN_EXPIRES_SECONDS=3600
LOGO_MAX_WIDTH_PX=256
LOGO_JPEG_QUALITY=85
```

Do **not** set `AWS_ENDPOINT_URL` unless you use a custom S3-compatible endpoint.

## Helper

`aws/env.js` — `getSesFromEmail()`, optional custom endpoint for logging.

See [FEATURES_AND_SCALING.md](./FEATURES_AND_SCALING.md).
