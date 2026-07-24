# CivicPulse
https://civic-pulse-ten-sigma.vercel.app/

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


## API highlights

- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/feedback?username=`
- `GET /api/feedback/nearby?lat=&lng=&radiusKm=`
- `PATCH /api/feedback/{id}/status?status=OPEN|IN_PROGRESS|RESOLVED`
- `POST /api/files/upload`, `GET /api/files/download/{fileId}`
- WebSocket: connect to `/ws`, send to `/app/chat.send`, subscribe to `/topic/feedback/{id}`
