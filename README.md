# Maritime-CMS

A **Maritime Content & Recruitment Platform** built with the **MERN stack** — MongoDB, Express.js, React, and Node.js.

This project serves as the foundation for an AI-assisted **recruitment and crew management system** initially focused on the maritime industry, with plans to scale into broader recruitment domains. It empowers shipping companies, crewing agencies, and seafarers with tools to manage jobs, applicant profiles, certification tracking, and crew deployment efficiently.

---

## ⚓ Overview

Maritime recruitment and crew management involves a complex set of workflows — from posting vacancies and managing applications to verifying certifications and scheduling crew. This platform aims to:

- Centralize candidate and job data  
- Automate crew qualification and certification tracking  
- Facilitate seamless hiring processes for maritime roles  
- Provide a scalable architecture for broader recruitment use cases

> Note: This project’s current codebase contains **frontend and backend modules**.  
> You can customize or extend specific domain features as required.

---

## 🚀 Features

### Core Features

✔️ User authentication (Recruiters & Candidates)  
✔️ Job posting and management dashboard  
✔️ Candidate profiles and resume handling  
✔️ Maritime certification and experience tracking  
✔️ Application filtering & search  
✔️ Role-based access control  

### Planned/Advanced

🌍 Multi-tenant support for agencies  
📊 Analytics dashboards for hiring metrics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Frontend | React, React Router |
| Database | MongoDB |
| API | RESTful endpoints |
| Authentication | JWT |
| State Management | React Context / Redux (optional) |

---

## 🔧 Environment & Deployment

### How Environment Variables Work

Nothing environment-specific is hardcoded in the source. URLs, secrets, and credentials all come from environment files that are **never committed** (they are git-ignored; only the `*.env.example` templates are tracked).

**Frontend (`frontend/`)** — Create React App loads env files automatically by command:

| Command | File loaded | Purpose |
|---------|-------------|---------|
| `npm start` | `.env.development` | Local development |
| `npm run build` | `.env.production` | Production build |

The only frontend variable is the API base URL:

```
REACT_APP_API_URL=http://localhost:8000      # .env.development
REACT_APP_API_URL=https://api.tursaile.in    # .env.production
```

It is consumed in `frontend/src/config/axios.js` via `process.env.REACT_APP_API_URL`. All API calls go through the shared `axiosi` instance (`withCredentials: true`), so there are no hardcoded URLs anywhere in the components.

> Note: CRA inlines `REACT_APP_*` variables at **build time**, so a production build must be created with `.env.production` present. Changing the value requires a rebuild.

**Backend (`backend/`)** — `index.js` loads `backend/env` then `backend/.env` (the latter overrides) via `dotenv`. Copy the template to get started:

```bash
cp backend/.env.example backend/.env
```

Key backend variables (see `backend/.env.example` for the full list):

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 8000) |
| `MONGO_URI` | MongoDB connection string |
| `ORIGIN` | Frontend URL, used for CORS + email links |
| `SECRET_KEY` | JWT signing secret |
| `EMAIL` / `PASSWORD` | Gmail SMTP credentials (when `EMAIL_PROVIDER` ≠ `ses`) |
| `EMAIL_PROVIDER` / `SES_FROM_EMAIL` | AWS SES email config |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials (standard SDK names) |
| `S3_BUCKET_NAME` | S3 bucket for file storage |

### Development Environment

```bash
# Backend
cd backend
cp .env.example .env          # fill in real values
npm install
npm run dev                   # nodemon on http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm start                     # uses .env.development -> http://localhost:3000
```

Development defaults: `REACT_APP_API_URL=http://localhost:8000`, backend `ORIGIN=http://localhost:3000`.

### Production Environment

- Frontend `.env.production`: `REACT_APP_API_URL=https://api.tursaile.in`
- Backend `.env`: production `MONGO_URI`, `ORIGIN=https://tursaile.in`, production AWS/email credentials, `PRODUCTION=true`.
- The backend runs under **pm2** (process name `backend`); the frontend is served as a static build by **nginx**.

Make the deploy scripts executable once:

```bash
chmod +x deploy-backend.sh deploy-frontend.sh
```

### How to Deploy Backend

```bash
./deploy-backend.sh
```

This pulls the latest `main`, installs dependencies, and restarts the pm2 process:

```bash
cd ~/Maritime-CMS
git pull origin main
cd backend
npm install
pm2 restart backend
```

### How to Deploy Frontend

```bash
./deploy-frontend.sh
```

This pulls the latest `main`, installs dependencies, rebuilds with `.env.production`, and reloads nginx:

```bash
cd ~/Maritime-CMS
git pull origin main
cd frontend
npm install
rm -rf build
npm run build
sudo systemctl reload nginx
```

### How to Change MongoDB Database

1. Edit `backend/.env` and update `MONGO_URI` with the new connection string, e.g.:

   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/new-db?retryWrites=true&w=majority
   ```

2. Restart the backend so the new connection is picked up:
   - Dev: restart `npm run dev`
   - Prod: `pm2 restart backend`

No code changes are needed — `backend/database/db.js` reads `process.env.MONGO_URI`.

### How to Change Email Credentials

Email is handled by `backend/utils/Emails.js` and switches on `EMAIL_PROVIDER`:

- **AWS SES** (`EMAIL_PROVIDER=ses`): update `SES_FROM_EMAIL`, `AWS_REGION`, and AWS credentials in `backend/.env`.
- **Gmail SMTP** (any other `EMAIL_PROVIDER`): update `EMAIL` and `PASSWORD` (a Gmail App Password) in `backend/.env`.
- To change where feedback notifications are sent, set `FEEDBACK_NOTIFY_EMAIL`.

Restart the backend (`pm2 restart backend` in production) after changing any value.


