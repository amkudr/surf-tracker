# Surf Tracker

FastAPI-based API for tracking surf sessions.

## Requirements

- Python 3.9+
- PostgreSQL 16+
- Docker and Docker Compose (optional)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file (optional):
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/surf_tracker
```

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

## Testing

```bash
pytest
```

## API Endpoints

- `POST /surf_session/` - Create a session
- `GET /surf_session/` - List sessions
- `GET /surf_session/{id}` - Get a session
- `PUT /surf_session/{id}` - Update a session
- `DELETE /surf_session/{id}` - Delete a session
