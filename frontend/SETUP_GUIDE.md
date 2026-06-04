# DBForge AI Studio — External Services Setup Guide

This guide walks you through setting up every external service the backend needs before you can run or deploy the app. Follow each section in order.

---

## Table of Contents

1. [MongoDB Atlas — Cloud Database](#1-mongodb-atlas--cloud-database)
2. [Anthropic API Key — AI Features](#2-anthropic-api-key--ai-features)
3. [Local Development — Running Everything](#3-local-development--running-everything)
4. [Render — Cloud Deployment](#4-render--cloud-deployment)
5. [Frontend Deployment — Vercel or Netlify](#5-frontend-deployment--vercel-or-netlify)
6. [Environment Variable Reference](#6-environment-variable-reference)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. MongoDB Atlas — Cloud Database

MongoDB Atlas gives you a free cloud MongoDB instance. The free tier (M0) is more than enough for development and early production.

### Step 1 — Create an Atlas account

1. Go to **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with your email (or Google/GitHub).
3. On the onboarding screen, choose **"Build a local environment"** → then switch to **"Create a cluster"** when prompted.

### Step 2 — Create a free cluster

1. Click **"Create"** → choose **M0 Free** tier.
2. Select a cloud provider. **AWS** + **us-east-1** (N. Virginia) or the region closest to your Render deployment region is recommended.
3. Name your cluster — e.g. `dbforge-cluster`.
4. Click **"Create Deployment"**. It takes 1–3 minutes to provision.

### Step 3 — Create a database user

1. In the left sidebar, click **"Database Access"** under the Security section.
2. Click **"Add New Database User"**.
3. Choose **"Password"** as the authentication method.
4. Set a username (e.g. `dbforge_user`) and a strong password. **Save these — you'll need them for the connection string.**
5. Under "Database User Privileges", select **"Read and write to any database"** (Atlas built-in role).
6. Click **"Add User"**.

### Step 4 — Whitelist IP addresses

1. In the left sidebar, click **"Network Access"** under Security.
2. Click **"Add IP Address"**.
3. For development: click **"Add Current IP Address"** to allow your machine.
4. For Render deployment: click **"Allow Access from Anywhere"** and add `0.0.0.0/0`.
   - This is safe for development. For production, you'd restrict to Render's specific IP ranges.
5. Click **"Confirm"**.

### Step 5 — Get the connection string

1. Go to **"Database"** in the left sidebar → click **"Connect"** on your cluster.
2. Choose **"Drivers"**.
3. Select **Node.js** and the latest version.
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@dbforge-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the database user you created in Step 3.
6. Add your database name before the `?` — e.g.:
   ```
   mongodb+srv://dbforge_user:YourPassword@dbforge-cluster.xxxxx.mongodb.net/dbforge?retryWrites=true&w=majority
   ```

**This full string is your `MONGODB_URI`.**

---

## 2. Anthropic API Key — AI Features

The backend uses Claude to generate schemas, write queries, and optimize SQL.

### Step 1 — Create an Anthropic account

1. Go to **https://console.anthropic.com**
2. Sign up or log in.
3. You may be placed on a waitlist for API access. If so, you'll get an email when approved.

### Step 2 — Get your API key

1. Once inside the Console, click your account name (top right) → **"API Keys"**.
2. Click **"Create Key"**.
3. Give it a name — e.g. `dbforge-backend`.
4. Copy the key immediately — it starts with `sk-ant-api03-...`. **You cannot view it again after closing the dialog.**

### Step 3 — Set up billing

1. Go to **"Billing"** in the left sidebar.
2. Add a payment method.
3. Set a usage limit to avoid surprise charges — $10–20/month is enough for development.

**The key you copied is your `ANTHROPIC_API_KEY`.**

---

## 3. Local Development — Running Everything

### Prerequisites

- Node.js 18+ installed
- npm 9+ installed

### Step 1 — Set up backend environment

1. Navigate to the `backend/` folder.
2. Copy the example env file:
   ```
   cp .env.example .env
   ```
3. Open `.env` and fill in your values:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://dbforge_user:YourPassword@dbforge-cluster.xxxxx.mongodb.net/dbforge?retryWrites=true&w=majority
   JWT_SECRET=a-random-string-at-least-32-characters-long-replace-this
   JWT_EXPIRES_IN=7d
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   FRONTEND_URL=http://localhost:5173
   ```

   **Important:** Generate a real `JWT_SECRET` using:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Install dependencies:
   ```
   cd backend
   npm install
   ```

5. Start the backend in dev mode:
   ```
   npm run dev
   ```
   You should see:
   ```
   [db] MongoDB connected: dbforge-cluster.xxxxx.mongodb.net
   [server] DBForge AI Studio API running on port 3001 (development)
   ```

### Step 2 — Set up frontend environment

1. Navigate to the `frontend/` folder.
2. Open `.env.local` — it already exists with defaults:
   ```env
   VITE_APP_NAME=DBForge AI Studio
   VITE_APP_VERSION=1.0.0
   VITE_API_URL=http://localhost:3001
   VITE_USE_MOCK=false
   ```
   Set `VITE_USE_MOCK=false` to connect to your real backend. Set to `true` to use mock simulators (no backend needed).

3. Install dependencies:
   ```
   cd frontend
   npm install
   ```

4. Start the frontend:
   ```
   npm run dev
   ```
   Open **http://localhost:5173** in your browser.

### Step 3 — Verify everything works

1. Open the app and click **"Create account"** to register.
2. Log in with your new account.
3. Create a project and click **"Generate Schema"** with AI.
4. If schema generation works, both the database and Anthropic API are connected correctly.

---

## 4. Render — Cloud Deployment

Render is a PaaS platform for hosting your backend API. The free tier is enough for personal projects.

### Step 1 — Create a Render account

1. Go to **https://render.com** and sign up (GitHub login recommended).

### Step 2 — Connect your GitHub repository

1. Push your project to a GitHub repository if you haven't already:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/dbforge-ai-studio.git
   git push -u origin main
   ```

2. In Render, click **"New"** → **"Web Service"**.
3. Connect your GitHub account and select your repository.

### Step 3 — Configure the Web Service

Render will detect `render.yaml` automatically. If not, fill these in manually:

| Setting | Value |
|---|---|
| **Name** | `dbforge-ai-studio-api` |
| **Region** | Oregon (US West) or your preferred region |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 4 — Set environment variables

In the Render dashboard, go to **"Environment"** → add each variable:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Your generated 32+ character secret |
| `JWT_EXPIRES_IN` | `7d` |
| `ANTHROPIC_API_KEY` | Your `sk-ant-api03-...` key |
| `FRONTEND_URL` | Your frontend URL (e.g. `https://dbforge.vercel.app`) |

**Do not** set `JWT_SECRET` to a guessable string in production. Use the `crypto` command from Step 3.1 above.

### Step 5 — Deploy

1. Click **"Create Web Service"**.
2. Render will pull your repo, install dependencies, build, and start the server.
3. Watch the logs — you should see the MongoDB connected message.
4. Your API will be live at a URL like `https://dbforge-ai-studio-api.onrender.com`.

### Step 6 — Test the deployment

Visit `https://dbforge-ai-studio-api.onrender.com/health` — you should see:
```json
{ "status": "ok", "env": "production", "timestamp": "..." }
```

**Note:** The free Render tier spins down after 15 minutes of inactivity. The first request after spin-down takes 30–60 seconds. Upgrade to the Starter plan ($7/month) to avoid this.

---

## 5. Frontend Deployment — Vercel or Netlify

### Option A — Vercel (recommended)

1. Go to **https://vercel.com** and sign up with GitHub.
2. Click **"New Project"** → import your repository.
3. Set the **Root Directory** to `frontend`.
4. Vercel auto-detects Vite — the default settings work.
5. Add environment variables:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://dbforge-ai-studio-api.onrender.com` |
   | `VITE_USE_MOCK` | `false` |
6. Click **"Deploy"**.

### Option B — Netlify

1. Go to **https://netlify.com** and sign up.
2. Click **"Add new site"** → **"Import from Git"**.
3. Select your repository.
4. Set **Base directory** to `frontend`, **Build command** to `npm run build`, **Publish directory** to `frontend/dist`.
5. Add the same environment variables as above.
6. Click **"Deploy site"**.

### Connecting frontend to backend

After both are deployed:
1. Go back to your Render service → **Environment** → update `FRONTEND_URL` to your Vercel/Netlify URL.
2. Trigger a new deploy on Render (or it will pick up on next push).

---

## 6. Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 3001) | Port the server listens on |
| `NODE_ENV` | No (default: development) | `development` or `production` |
| `MONGODB_URI` | **Yes** | Full Atlas connection string including database name |
| `JWT_SECRET` | **Yes** | Min 32-character random string for signing tokens |
| `JWT_EXPIRES_IN` | No (default: 7d) | Token lifetime (7d, 30d, 1h, etc.) |
| `ANTHROPIC_API_KEY` | **Yes** | Anthropic API key for AI features |
| `FRONTEND_URL` | **Yes** | Frontend origin for CORS (e.g. `https://dbforge.vercel.app`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No (default: http://localhost:3001) | Backend API base URL |
| `VITE_USE_MOCK` | No (default: true) | `true` = offline mock mode, `false` = real backend |
| `VITE_APP_NAME` | No | App display name |
| `VITE_APP_VERSION` | No | App version string |

---

## 7. Troubleshooting

### "MongoServerError: Authentication failed"
- Double-check the username and password in your `MONGODB_URI`.
- Make sure the database user was created in **Database Access**, not just the Atlas account.
- Passwords with special characters (`@`, `#`, `!`) must be URL-encoded.

### "MongoNetworkError: connection timed out"
- Check **Network Access** in Atlas — your IP must be whitelisted.
- For Render, add `0.0.0.0/0` to allow all IPs.

### "Invalid API Key" from Anthropic
- Make sure you copied the full key including `sk-ant-api03-` prefix.
- Keys are not visible after creation — if lost, generate a new one.

### CORS errors in browser
- `FRONTEND_URL` in the backend must exactly match your frontend's origin (including `https://` and no trailing slash).
- In development, this should be `http://localhost:5173`.

### JWT "invalid signature" errors
- `JWT_SECRET` must be the same value everywhere. If you rotate it, all existing tokens become invalid and users must log in again.

### Render "Application failed to respond"
- Check the Render logs for the actual error.
- Common cause: a required env variable is missing — compare against the table in Section 6.
- Make sure `PORT` matches what Render expects (use `3001` or let Render override via its own `PORT` env var).

### Frontend shows "Network Error" on API calls
- `VITE_API_URL` must point to your deployed Render URL (not localhost) in production.
- Check that `VITE_USE_MOCK=false` so it actually calls the backend.
- Open DevTools → Network tab to see what URL the request is hitting and what the response is.
