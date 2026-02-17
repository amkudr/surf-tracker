# Surf Tracker

A comprehensive surf session tracking application built with FastAPI that helps surfers log their sessions, track conditions, and discover new surf spots.

## Features

- **Session Tracking**: Record surf sessions with detailed information including date, duration, wave conditions, and difficulty ratings
- **Weather Integration**: Automatic weather data retrieval using Open-Meteo API for accurate session conditions
- **Spot Management**: Create and manage surf locations with GPS coordinates
- **User Authentication**: Secure user registration and login with JWT tokens
- **RESTful API**: Complete REST API with automatic OpenAPI documentation
- **Database**: PostgreSQL with Alembic migrations for data persistence
- **Testing**: Comprehensive test suite with pytest

## Technology Stack

- **Backend**: FastAPI (Python async web framework)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with password hashing
- **Weather API**: Open-Meteo for real-time weather data
- **Migrations**: Alembic for database schema management
- **Testing**: pytest with async support
- **Containerization**: Docker & Docker Compose for easy deployment

## Requirements

- Python 3.9+
- PostgreSQL 16+
- Docker and Docker Compose (optional)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file (required) using `.env.example` as a template:
```bash
cp .env.example .env
```
Then fill in at least:
- `DATABASE_URL` – your Postgres connection string (async driver for app, sync driver for Alembic is derived automatically)
- `SECRET_KEY` – strong random string used for JWTs and session cookies
- `ADMIN_BOOTSTRAP_TOKEN` – strong token required by the admin creation CLI

3. Start PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

4. Run migrations:
```bash
alembic upgrade head
```

## Running

```bash
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

API documentation: http://localhost:8000/docs

## Running with Docker Compose

```bash
docker compose up --build
```

- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- PgAdmin: http://localhost:5050

### Run Worker + Postgres Only

```bash
docker compose up --build postgres worker
```

## Testing

```bash
pytest
```

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

### Surf Spots
- `POST /spot/` - Create a spot
- `GET /spot/` - List spots
- `GET /spot/{id}` - Get a spot
