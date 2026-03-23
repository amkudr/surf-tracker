# Surf Tracker

[![CI](https://github.com/amkudr/surf-tracker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/amkudr/surf-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Live Demo](https://surf-tracker.up.railway.app)** | **[API Docs](https://surf-tracker-production.up.railway.app/docs)**

A comprehensive surf session tracking application built with FastAPI that helps surfers log their sessions, track conditions, and discover new surf spots.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture--request-flow)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running](#running)
- [Running with Docker Compose](#running-with-docker-compose)
- [Web Security](#web-security-cors-csrf-headers)
- [Testing](#testing)
- [Health](#health)
- [Seeding](#seeding-optional-dev)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [License](#license)

## Features

- **Session Tracking**: Record surf sessions with detailed information including date, duration, wave conditions, and difficulty ratings
- **Weather Integration**: Automatic weather data retrieval using Open-Meteo API for accurate session conditions
- **Spot Management**: Create and manage surf locations with GPS coordinates
- **User Authentication**: Secure user registration and login with JWT tokens
- **RESTful API**: Complete REST API with automatic OpenAPI documentation
- **Database**: PostgreSQL with Alembic migrations for data persistence
- **Testing**: Comprehensive test suite with pytest

## Technology Stack

- **Backend**: FastAPI (Python 3.11, async web framework)
- **Frontend**: React 18 (TypeScript, Vite, TailwindCSS)
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with password hashing
- **Weather API**: Open-Meteo for real-time weather data
- **Migrations**: Alembic for database schema management
- **Testing**: pytest (backend), Vitest + Playwright (frontend)
- **Containerization**: Docker & Docker Compose for easy deployment

<details>
<summary>📐 Architecture — Request Flow</summary>

```mermaid
sequenceDiagram
    autonumber
    participant Browser as 🌐 React (Vite)
    participant Axios as 📡 Axios
    participant Nginx as 🔀 Nginx
    participant FastAPI as 🚀 FastAPI
    participant Auth as 🔐 JWT Auth
    participant Pydantic as 📋 Pydantic
    participant Service as ⚙️ Service Layer
    participant DB as 🐘 PostgreSQL

    Browser ->> Axios: User action (e.g. form submit)
    Note over Axios: Interceptor adds<br/>Authorization: Bearer JWT

    Axios ->> Nginx: HTTPS/REST request
    Nginx ->> FastAPI: HTTP/1.1 (proxy_pass)

    FastAPI ->> Auth: Depends(get_current_user)
    Auth ->> DB: SELECT user (asyncpg/TCP)
    DB -->> Auth: User row
    Auth -->> FastAPI: CurrentUser

    FastAPI ->> Pydantic: Parse & validate JSON body
    Note over Pydantic: JSON → Pydantic Model

    alt Validation error
        Pydantic -->> Axios: 422 Unprocessable Entity
    end

    FastAPI ->> Service: Call service function
    Note over Service: Business logic:<br/>resolve relations,<br/>fetch external data

    Service ->> DB: SQL query (asyncpg/TCP)
    DB -->> Service: Result rows

    Service ->> DB: COMMIT
    DB -->> Service: OK

    alt DB failure
        DB --x Service: ConnectionError
        Service -->> Axios: 500 Internal Server Error
    end

    Service -->> FastAPI: ORM object
    Note over FastAPI: ORM → Pydantic<br/>response model

    FastAPI -->> Nginx: JSON response
    Nginx -->> Axios: HTTPS response
    Axios -->> Browser: Update UI
```

</details>


## Project Structure

```
surf-tracker/
├── app/                    # Backend application
│   ├── api/v1/             # REST API endpoints (auth, sessions, spots, surfboards)
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/           # Business logic layer
│   ├── scripts/            # CLI utilities (seed, admin creation)
│   ├── external_apis/      # Third-party API integrations
│   ├── core/               # App configuration & security
│   ├── admin/              # SQLAdmin panel
│   └── worker.py           # Background scraper (APScheduler + Playwright)
├── frontend/               # React SPA (Vite + TypeScript + TailwindCSS)
│   ├── src/
│   └── tests/              # Vitest unit tests & Playwright e2e tests
├── alembic/                # Database migrations
├── tests/                  # Backend pytest suite
├── docker-compose.yml
├── Dockerfile
└── Dockerfile.worker
```

## Requirements

- Python 3.11
- PostgreSQL 16+
- Docker and Docker Compose (optional)

## Installation

1. Install dependencies:
```bash
uv pip install -e ".[api,worker,dev]"
```

2. Create `.env` file using `.env.example` as a template:
```bash
cp .env.example .env
```
See [Configuration](#configuration) section for details on required variables.

3. Start PostgreSQL with Docker Compose (optional):
```bash
docker compose up -d postgres
```

4. Apply database migrations (required):
```bash
alembic upgrade head
```

5. Frontend setup (optional if not using Docker):
```bash
cd frontend
npm install
```

## Configuration

The application is configured using environment variables. The easiest way to manage them is via a `.env` file in the project root.

### Required Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`). |
| `SECRET_KEY` | High-entropy string for JWT tokens and session cookies. |
| `ADMIN_BOOTSTRAP_TOKEN` | Guard token required by the `create_admin` CLI script. |

### Other Tunables

Refer to [.env.example](.env.example) for a complete list of optional settings, including:
- CORS allowed origins (`CORS_ALLOWED_ORIGINS`, disabled by default)
- Token lifetimes (`ACCESS_TOKEN_EXPIRE_MINUTES`)
- Database pool tuning (`POOL_SIZE`, `MAX_OVERFLOW`)
- Security flags (`SESSION_COOKIE_SECURE`, `SECURITY_ENABLE_HSTS`)
- Background worker schedule (`SCHEDULE_START_HOUR`, `SCHEDULE_END_HOUR`)

## Running

```bash
uvicorn app.main:app --reload --log-config uvicorn_log_config.json
```

API will be available at: http://localhost:8000

API documentation: http://localhost:8000/docs

## Running with Docker Compose

```bash
docker compose up --build
```

- Frontend & API Proxy (Nginx): http://localhost:5173
  - API is routed through `/api/` (e.g., `http://localhost:5173/api/health`)
  - API docs (Swagger): `http://localhost:5173/api/docs`
- PgAdmin: http://localhost:5050

Migrations are applied automatically by the `migrations` service before backend/worker start. You can also run them manually with:

```bash
docker compose run --rm backend alembic upgrade head
```

### Run Worker + Postgres Only

```bash
docker compose up --build postgres worker
```

## Web Security (CORS, CSRF, Headers)

The backend now applies a minimal web security baseline:

- **CORS allowlist** via `CORS_ALLOWED_ORIGINS` (JSON array).
- **Session cookie hardening** for admin auth via `SameSite=Lax`; `Secure` is configurable.
- **Security response headers** are added to all responses.

### CORS policy

- The frontend interacts with the backend through an Nginx reverse proxy (same-origin), so CORS is generally not needed in production.
- `CORS_ALLOWED_ORIGINS` must be set as a JSON array of allowed origins (mainly used for local development).
- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allowed request headers: `Authorization, Content-Type, X-Request-ID`
- Exposed response headers: `X-Request-ID`

### CSRF posture

- Public API authentication uses Bearer tokens (not cookie-based auth).
- SQLAdmin/admin uses a session cookie with `SameSite=Lax`.
- Set `SESSION_COOKIE_SECURE=true` in HTTPS deployments so the cookie is sent only over TLS.

### Security headers

Enabled by default:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

Optional:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` when:
  - `SECURITY_ENABLE_HSTS=true`
  - request scheme is HTTPS

### Production recommendations

- Set `CORS_ALLOWED_ORIGINS` to explicit production frontend origin(s).
- Set `SESSION_COOKIE_SECURE=true` when running behind TLS.
- Enable `SECURITY_ENABLE_HSTS=true` only when HTTPS is enforced end-to-end.

## Testing

Backend:

```bash
pytest
```

Frontend (lint + unit tests):

```bash
cd frontend
npm run lint
npm test
```

Frontend (Playwright e2e — requires running backend + frontend):

```bash
cd frontend
npm run test:e2e
```


## Health

- `GET /health` returns `{"status":"ok","db":"up"}` when the API can reach the database. The backend container healthcheck uses this endpoint.

## Seeding (optional, dev)

Seed a full sample dataset (Sri Lanka west coast spots + demo users with surfboards and sessions, idempotent):

- Local:
  ```bash
  python -m app.scripts.seed_dev_data
  ```

- Docker:
  ```bash
  docker compose run --rm backend python -m app.scripts.seed_dev_data
  ```

Included users: `demo@surf.local` / `surf1234` and `lena@surf.local` / `surf1234`.

Flags:
- `--no-sample-data` to skip the bundled fixtures
- `--email EMAIL --password PASSWORD` to add an extra user
- `--spots-json path/to/spots.json` to seed additional spots from a JSON array

Add only the Sri Lanka west coast spot pack (idempotent, no users/sessions):

```bash
python -m app.scripts.seed_sri_lanka_west_spots
```

This seeds 14 common breaks around Weligama, Midigama, Madiha, Dewata, and Hikkaduwa with surf-forecast slugs so the scraper can pull conditions.

## Authentication

The API uses Bearer token authentication. Register a user, login to get a token, then use the token in the `Authorization` header for protected endpoints.

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get Bearer token
- `GET /auth/me` - Get current user (requires Bearer token)

### Creating the first admin (privileged path)

Admins cannot be created through public registration. Use the guarded CLI instead:

```bash
ADMIN_BOOTSTRAP_TOKEN=<value from .env> \
python -m app.scripts.create_admin --email admin@example.com --password "StrongPass123" --token <same token>
```

If an admin with that email already exists, the script reports and exits without changes.

## API Endpoints

### Surf Sessions
- `POST /surf_session/` - Create a session
- `GET /surf_session/` - List sessions
- `GET /surf_session/{id}` - Get a session
- `PUT /surf_session/{id}` - Update a session
- `DELETE /surf_session/{id}` - Delete a session

### Surfboards
- `POST /surfboard/` - Create a surfboard
- `GET /surfboard/` - List user's surfboards
- `GET /surfboard/{id}` - Get a surfboard
- `PUT /surfboard/{id}` - Update a surfboard
- `DELETE /surfboard/{id}` - Delete a surfboard

### Surf Spots
- `POST /spot/` - Create a spot
- `GET /spot/` - List spots
- `GET /spot/{id}` - Get a spot

## Development

```bash
make install-dev          # install all dependencies (incl. dev)
make lint                 # ruff + black + mypy
make format               # auto-fix style issues
pre-commit install        # enable git hooks
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
