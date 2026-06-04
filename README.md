# DBForge AI Studio

> AI-powered database design tool — generate schemas, visualize ERDs, run queries, test APIs, and connect to real databases.

## Features

- **Schema Designer** — Generate complete database schemas from natural language using Claude AI
- **ER Visualizer** — Interactive entity-relationship diagrams with Dagre auto-layout
- **Query Editor** — Monaco-powered SQL editor with AI generation, optimization, and live DB execution
- **API Checker** — Full REST API testing with test scripts, collections, and DB-backed assertions
- **Connections** — Connect to PostgreSQL, MySQL, SQLite, and MongoDB for live interaction
- **Collaboration** — Workspaces, project sharing, schema versioning, and threaded comments

## Tech Stack

| Layer     | Technologies                                                              |
|-----------|---------------------------------------------------------------------------|
| Frontend  | React 19, Vite 8, TypeScript 6, Tailwind CSS v3.4, React Flow, Monaco Editor |
| Backend   | Node.js, Express, MongoDB, Mongoose, Zod, Anthropic SDK                  |
| Auth      | JWT (7-day expiry), bcrypt password hashing                              |
| DB Drivers| pg (PostgreSQL), mysql2 (MySQL), better-sqlite3 (SQLite), mongodb (MongoDB) |
| Deployment| Vercel (frontend) + Render (backend)                                     |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Anthropic API key

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and API keys
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend URL
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Required | Description                           |
|---------------------|----------|---------------------------------------|
| `MONGODB_URI`       | ✅        | MongoDB connection string             |
| `JWT_SECRET`        | ✅        | Secret for signing JWTs               |
| `ANTHROPIC_API_KEY` | ✅        | Claude API key                        |
| `FRONTEND_URL`      | ✅        | Frontend origin for CORS              |
| `PORT`              | —        | Server port (default: 3001)           |
| `JWT_EXPIRES_IN`    | —        | Token expiry (default: 7d)            |

### Frontend (`frontend/.env`)

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `VITE_API_URL` | ✅        | Backend API base URL (no trailing slash) |
| `VITE_USE_MOCK`| —        | Use mock data (default: false)           |

## Project Structure

```
dbforge-ai-studio/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, env validation
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, rate limiting, sanitization
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   └── services/       # AI, DB connectors, version diffing
│   └── render.yaml         # Render deployment config
└── frontend/
    ├── src/
    │   ├── app/            # Providers, Router, App shell
    │   ├── components/     # Shared layout components
    │   ├── context/        # React contexts (Project, UI, Toast)
    │   ├── features/       # Feature panels (schema, visualizer, etc.)
    │   ├── lib/            # API clients, utils, mock data
    │   ├── pages/          # Route-level pages
    │   └── types/          # TypeScript types
    └── vercel.json         # Vercel deployment + CSP headers
```

## API Endpoints

| Method | Path                                    | Description                  |
|--------|-----------------------------------------|------------------------------|
| POST   | /api/auth/register                      | Register user                |
| POST   | /api/auth/login                         | Login, returns JWT           |
| GET    | /api/auth/me                            | Get current user             |
| GET    | /api/projects                           | List user projects           |
| POST   | /api/projects                           | Create project               |
| PUT    | /api/projects/:id                       | Update project (auto-versions schema) |
| DELETE | /api/projects/:id                       | Delete project               |
| POST   | /api/schema/generate                    | AI schema generation         |
| POST   | /api/query/generate                     | AI query generation          |
| POST   | /api/query/execute                      | Execute raw SQL query        |
| GET    | /api/connections                        | List DB connections          |
| POST   | /api/connections                        | Save new connection          |
| POST   | /api/connections/:id/reverse            | Reverse-engineer schema      |
| POST   | /api/request/send                       | Proxy HTTP request           |
| GET    | /api/versions/project/:id               | List schema versions         |
| POST   | /api/versions/project/:id/:v/revert     | Revert to version            |
| GET    | /api/comments/project/:id               | List comments                |
| POST   | /api/comments/project/:id               | Add comment                  |
| GET    | /api/workspaces                         | List workspaces              |
| POST   | /api/workspaces/:id/members             | Invite team member           |
| GET    | /api/collections                        | List API collections         |
| POST   | /api/collections/:id/run                | Run collection               |
| GET    | /api/health                             | Health check                 |

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. **Root directory:** `frontend/`
4. **Build command:** `npm run build`
5. **Output directory:** `dist/`
6. Set env vars: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render

1. Push to GitHub
2. New **Web Service** on [render.com](https://render.com)
3. **Root directory:** `backend/`
4. **Build command:** `npm install && npm run build`
5. **Start command:** `npm start`
6. **Health check path:** `/api/health`
7. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push and open a pull request

Please follow the existing code style — TypeScript strict mode, no `any`, Tailwind for all styling.

## License

MIT
