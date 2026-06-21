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

# Email — provider switch + sender identities (see SES.md)
EMAIL_PROVIDER=ses                 # "ses" = Amazon SES; anything else = SMTP
SES_FROM_EMAIL=Tursaile <noreply@tursaile.in>
SES_ADMIN_FROM_EMAIL=Tursaile Admin <admin@tursaile.in>
MAIL_REPLY_TO=support@tursaile.in
FEEDBACK_NOTIFY_EMAIL=admin@tursaile.in
SUPPORT_BCC_EMAIL=support@tursaile.in
# SMTP (only used when EMAIL_PROVIDER is not "ses")
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL=admin@tursaile.in
PASSWORD=<mailbox password>

S3_PRESIGN_EXPIRES_SECONDS=3600
LOGO_MAX_WIDTH_PX=256
LOGO_JPEG_QUALITY=85
```

Do **not** set `AWS_ENDPOINT_URL` unless you use a custom S3-compatible endpoint.

## Development vs production

These values differ between local dev and the deployed prod server (which keeps its own `.env`):

| Var | Dev | Production |
|-----|-----|------------|
| `PRODUCTION` | `false` | `true` — enables secure, `SameSite=None` auth cookies (needs HTTPS) |
| `NODE_ENV` | `development` | `production` — hides raw error details in API responses |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` (dev only) | **remove** — never disable TLS validation in prod |
| `ORIGIN` | `http://localhost:3000` | `https://tursaile.in` (CORS + email links) |
| `SECRET_KEY` | any | long random secret |
| `MONGO_URI` | dev cluster | prod cluster (`maritime-prod-cluster`, dedicated DB) |
| `S3_BUCKET_NAME` | `maritime-cms-dev-upload` | `maritime-cms-prod-upload` |
| `AWS_ACCESS_KEY_ID` / `_SECRET` | `maritime-cms-local` user | dedicated `maritime-cms-prod` IAM user (S3 + SES, least privilege) |
| `EMAIL_PROVIDER` | `smtp` (Hostinger) while SES sandbox; flip to `ses` after AWS approves | `ses` once production access granted |

Bucket name and region are fully env-driven (`aws/clients.js`, `storage.service.js`), so switching to the prod bucket needs **no code change** — only the env vars + AWS-side setup (bucket, IAM, network access).

## Helper

`aws/env.js` — `getSesFromEmail()`, optional custom endpoint for logging.

See [FEATURES_AND_SCALING.md](./FEATURES_AND_SCALING.md).
