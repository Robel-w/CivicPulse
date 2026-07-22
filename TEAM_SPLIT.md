# CivicPulse — 3-Person Team Split & GitHub Push Plan

This splits the project by **course topics** so each teammate owns one area for commits, defense, and a separate feature branch/PR.

**Important:** You still need **one runnable app** on `main`. Each person works on a **branch**, merges in order (or parallel with agreed shared files). Do not create three unrelated repos unless your professor allows it.

---

## Recommended 3 topics (matches Advanced Programming themes)

| Teammate | Topic branch name | Course theme | One-line ownership |
|----------|-------------------|--------------|-------------------|
| **Person 1** | `feature/database-persistence` | **Database** | JPA entities, repositories, SQL seed, users & feedback data layer |
| **Person 2** | `feature/networking-realtime` | **Networking + concurrency** | REST APIs, WebSocket/STOMP chat, `@Async` notifications, scheduling |
| **Person 3** | `feature/files-and-frontend` | **File transfer + client** | Multipart upload/download, React UI, maps, auth screens |

---

## Person 1 — Database & persistence

**Defense focus:** ER diagram, JPA relationships, CRUD, `data.sql`, seed users.

### Backend — primary ownership

```
backend/src/main/java/com/civicpulse/backend/model/
  User.java, UserRole.java, Feedback.java, Message.java,
  Notification.java, Attachment.java

backend/src/main/java/com/civicpulse/backend/repository/
  UserRepository.java, FeedbackRepository.java, MessageRepository.java,
  NotificationRepository.java, AttachmentRepository.java

backend/src/main/java/com/civicpulse/backend/config/
  DatabaseInitializer.java

backend/src/main/java/com/civicpulse/backend/service/
  AuthService.java, MessageService.java

backend/src/main/java/com/civicpulse/backend/controller/
  AuthController.java, UserController.java

backend/src/main/java/com/civicpulse/backend/dto/
  LoginRequest.java, RegisterRequest.java, AuthResponse.java,
  ProfileUpdateRequest.java, MessageResponse.java

backend/src/main/resources/
  application.yml, data.sql

backend/src/test/java/.../BackendApplicationTests.java
```

### Shared file — Person 1 leads first PR

`FeedbackService.java` — **Person 1 implements:**
- `createFeedback`, `getAllFeedback`, `getFeedbackById`, `getFeedbackBySector`
- `convertToResponse`, `getInvolvedFeedback` (uses JPQL from repository)
- `FeedbackController.java` — all mappings **except** document that `/nearby` is added by Person 2

`FeedbackRequest.java`, `FeedbackResponse.java` — create with Person 1; Person 2 may add fields later.

### Suggested commit message examples

- `feat(db): add User and Feedback JPA entities with relationships`
- `feat(db): add repositories and DatabaseInitializer seed data`
- `feat(db): implement auth and profile CRUD`

---

## Person 2 — Networking & real-time

**Defense focus:** REST vs WebSocket, STOMP destinations, CORS, `@Async`, scheduled tasks.

### Backend — primary ownership

```
backend/src/main/java/com/civicpulse/backend/websocket/
  WebSocketConfig.java, ChatController.java, ChatMessage.java

backend/src/main/java/com/civicpulse/backend/controller/
  NotificationController.java
  (+ add GET /feedback/nearby in FeedbackController)

backend/src/main/java/com/civicpulse/backend/service/
  NotificationService.java, CleanupTask.java

backend/src/main/java/com/civicpulse/backend/config/
  AsyncConfig.java, WebConfig.java

backend/src/main/java/com/civicpulse/backend/exception/
  GlobalExceptionHandler.java
```

### Shared file — Person 2 second PR (after Person 1 merges)

`FeedbackService.java` — **Person 2 adds:**
- `getNearby(...)` + `haversineKm(...)` (or `util/GeoUtils.java` if you refactor)
- call to `notificationService.notifyAdminsInSector(...)` inside `createFeedback` (coordinate with Person 1)

`pom.xml` — Person 2 adds `spring-boot-starter-websocket` if not already on main.

### Frontend — Person 2 ownership

```
frontend/src/services/api.js
frontend/src/services/websocket.js
frontend/src/pages/IssueDetail.jsx      (chat + STOMP)
frontend/src/pages/NotificationsPage.jsx
```

### Suggested commit messages

- `feat(net): add STOMP WebSocket config and chat controller`
- `feat(net): async notifications and notification REST API`
- `feat(net): add nearby feedback geo endpoint`
- `feat(ui): connect issue chat to WebSocket`

---

## Person 3 — File transfer & frontend application

**Defense focus:** `MultipartFile`, download headers, BLOB storage, React routes, maps, file UI.

### Backend — primary ownership

```
backend/src/main/java/com/civicpulse/backend/controller/FileController.java
backend/src/main/java/com/civicpulse/backend/service/FileStorageService.java
```

(Attachment **entity/repository** stay with Person 1; Person 3 only uses them in `FileStorageService`.)

### Frontend — primary ownership

```
frontend/src/App.jsx, main.jsx, index.css, App.css
frontend/src/context/AuthContext.jsx
frontend/src/pages/Home.jsx, Login.jsx, Register.jsx, Dashboard.jsx,
  MapPage.jsx, ReportIssue.jsx, Profile.jsx
frontend/index.html
frontend/public/
frontend/package.json, package-lock.json, vite.config.*, tailwind.config.*, postcss.config.*
frontend/Dockerfile
```

### DevOps (optional shared — Person 3)

```
docker-compose.yml
backend/Dockerfile
README.md (create at repo root — all three contribute one section)
```

### Suggested commit messages

- `feat(files): multipart upload and download API`
- `feat(ui): auth pages and dashboard`
- `feat(ui): map-based report issue with file upload`

---

## Merge order (avoid Git conflicts)

```text
main (minimal scaffold: empty Spring Boot + Vite shell)
  │
  ├─► PR1: feature/database-persistence     (Person 1) ──merge──►
  │
  ├─► PR2: feature/networking-realtime      (Person 2) ──merge──►
  │
  └─► PR3: feature/files-and-frontend       (Person 3) ──merge──►
```

Person 2 needs Person 1’s entities/repos. Person 3 needs Person 1’s API + Person 2’s `api.js` base URL (or use env var).

**Parallel tip:** After PR1 merges, Person 2 and 3 can branch from updated `main` but Person 3’s `ReportIssue` should wait until feedback POST exists.

---

## Shared files — rules

| File | Rule |
|------|------|
| `pom.xml` | Person 1: JPA/web/validation/mysql/lombok. Person 2: websocket. Person 3: no change unless needed. |
| `BackendApplication.java` | Person 1 only touches (default). |
| `FeedbackService.java` | Person 1 first, Person 2 adds methods in separate commit. |
| `FeedbackController.java` | Person 1: base routes; Person 2: `/nearby`. |
| `App.jsx` | Person 3 owns routes; Person 2 adds nothing here (pages imported by Person 3). |

---

## Do NOT push to GitHub

### Never (build / IDE / dependencies)

| Path | Reason |
|------|--------|
| `frontend/node_modules/` | Regenerate with `npm install` |
| `frontend/dist/` | Build output |
| `backend/target/` | Maven build output |
| `.idea/` | IntelliJ personal settings |
| `*.iml` | IDE project files |
| `backend/.git/` | **Nested git repo** — remove if accidental; use one repo at root |

### Should not (dead, AI-checklist, or misleading)

| Path | Reason |
|------|--------|
| `dto/ApiResponse.java` | **Unused** — delete before push or professors ask why it exists |
| Commented block at bottom of `WebSocketConfig.java` (lines 30–46) | Looks like copy-paste / regenerate artifact |
| `frontend/src/components/Navbar.jsx` | **Never imported** — dead code; delete or wire into `App.jsx` |
| `DEFENSE.md` | Optional — Cursor defense prep; fine for private study, **omit from submission** if professor forbids AI assistance docs |
| Root `package-lock.json` | Empty lockfile (`packages: {}`) — **delete**; only `frontend/package-lock.json` matters |
| `backend/HELP.md` | Default Spring doc — optional |
| `frontend/src/assets/react.svg`, `vite.svg` | Default Vite boilerplate — optional delete |
| `backend/src/main/resources/application.properties` | Only `spring.application.name` — redundant with `application.yml`; pick one |

### Push with caution (explain if kept)

| Item | Note |
|------|------|
| `docker-compose.yml` + Dockerfiles | Fine if team understands them; Java 21 in Dockerfile vs Java 17 in `pom.xml` — align |
| `CleanupTask.java` | Empty body looks like “requirement checkbox” — implement real cleanup or remove before push |
| `framer-motion` | Only used in `IssueDetail.jsx` — optional; remove dep if you drop animations |
| Plaintext passwords in seed | OK for demo; mention in README |

### Antigravity / AI fingerprints

**No “Antigravity” strings were found** in this repo. Nothing proves Antigravity specifically. Things that still look **template/AI-generated** to a professor:

- Marketing copy on `Home.jsx`
- Duplicate haversine in two services
- Unused `ApiResponse`, empty `CleanupTask`, dead `Navbar`
- `DEFENSE.md` (if committed) — clearly examiner-prep from AI

---

## Root `.gitignore` (add before first push)

Create **`/.gitignore`** at repo root:

```gitignore
# IDE
.idea/
*.iml
.vscode/

# Backend
backend/target/

# Frontend
frontend/node_modules/
frontend/dist/

# OS
.DS_Store
Thumbs.db

# Env secrets (if you add later)
.env
*.env.local
```

---

## README sections (each person writes one)

```markdown
# CivicPulse
## Team
- Person 1 — Database: ...
- Person 2 — Networking: ...
- Person 3 — Files & Frontend: ...

## Run locally
...

## Topic mapping (course)
- Database: ...
- Networking: ...
- Multithreading: ...
- File transfer: ...
```

---

## Rough workload balance

| Person | Backend files (approx) | Frontend files (approx) | Complexity |
|--------|------------------------|-------------------------|------------|
| 1 | ~22 | 0 | JPQL + relationships |
| 2 | ~12 | 4 | WebSocket + async (hardest to explain) |
| 3 | ~2 + Docker | ~12 | Most UI lines, file API |

Person 3 has more **lines** of UI; Person 2 has **harder** concepts. Person 1 has the **data model** everyone depends on — start first.

---

## Quick checklist before `git push`

- [x] Root `.gitignore` added
- [ ] `node_modules` and `target` not tracked (`git rm -r --cached` if needed)
- [ ] No nested `backend/.git` (remove folder if present)
- [x] Removed: `ApiResponse.java`, `Navbar.jsx`, commented `WebSocketConfig`, root `package-lock.json`, `DEFENSE.md`
- [x] `GeoUtils`, real `CleanupTask`, `PATCH .../status`, Java 17 Docker alignment
- [ ] Each branch has **only that person’s commits** (use `git log --author`)
- [ ] `main` runs: MySQL + backend + frontend
- [x] Root `README.md` — fill in team member names
