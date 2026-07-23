# CivicPulse

Map-based civic feedback platform for an Advanced Programming course project. Citizens report geo-tagged issues; sector admins review sector lists and chat on each issue in real time.

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8 (local port `3306`, database `civicpulse`)

## Run locally

### 1. Database

Start MySQL and ensure root can connect (empty password by default in config).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

## Demo accounts (seeded on startup)

| Role | Username | Password | Sector |
|------|----------|----------|--------|
| Citizen | `user` | `password123` | — |
| Admin | `admin_elec` | `admin123` | electricity |
| Admin | `admin_trans` | `admin123` | transport |

## Docker (optional)

```bash
docker compose up --build
```

MySQL is exposed on host port `3307` when using compose.

## Deploy to Render

Render hosts the **backend** (Docker) and **frontend** (static site). You still need a **hosted MySQL** database — Render only offers managed PostgreSQL, and this app uses MySQL.

### 1. MySQL database

Create a MySQL 8 instance with any provider, for example:

- [Railway](https://railway.app) — MySQL template
- [PlanetScale](https://planetscale.com)
- [Aiven](https://aiven.io)

Create a database named `civicpulse` and note the JDBC URL, username, and password. Example URL format:

```text
jdbc:mysql://HOST:3306/civicpulse?useSSL=true&serverTimezone=UTC
```

### 2. Push to GitHub

Render deploys from Git. Push this repository to GitHub (or GitLab).

### 3. Deploy with Blueprint

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your repository
3. Render reads `render.yaml` and creates two services:
   - `civicpulse-api` — Spring Boot backend (Docker)
   - `civicpulse-frontend` — React static site
4. When prompted, set these **secret** env vars on `civicpulse-api`:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
5. Click **Apply**. Render builds both services and wires `VITE_API_URL` / CORS automatically.

### 4. Manual setup (alternative)

If you prefer not to use the blueprint:

**Backend** — New → Web Service → Docker, root `backend`, Dockerfile `backend/Dockerfile`

| Variable | Value |
|----------|-------|
| `SPRING_DATASOURCE_URL` | Your MySQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `APP_PUBLIC_URL` | `https://YOUR-API.onrender.com` |
| `APP_CORS_ORIGINS` | `https://YOUR-FRONTEND.onrender.com` |

**Frontend** — New → Static Site, root `frontend`

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com` |

Build command: `npm install && npm run build`  
Publish directory: `dist`

### Notes

- Free-tier web services **spin down after inactivity** (~50 s cold start on first request).
- Demo accounts are seeded automatically on first backend startup (see table above).
- WebSocket chat uses the same `VITE_API_URL` as the REST API.

## Security note

Authentication is for **course demo only** (plaintext passwords, no Spring Security). 

## API highlights

- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/feedback?username=`
- `GET /api/feedback/nearby?lat=&lng=&radiusKm=`
- `PATCH /api/feedback/{id}/status?status=OPEN|IN_PROGRESS|RESOLVED`
- `POST /api/files/upload`, `GET /api/files/download/{fileId}`
- WebSocket: connect to `/ws`, send to `/app/chat.send`, subscribe to `/topic/feedback/{id}`
