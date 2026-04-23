"""Demo data reset service.

Deletes all mutable data for the demo user and re-seeds it
from the same fixtures used in seed_dev_data.py.

IMPORTANT: All DB operations are performed through the *same* AsyncSession
that was opened by the request, so delete + insert are fully atomic.
"""

import asyncio

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SurfSession, Surfboard, SurfSessionReview
from app.models.users import User
from app.schemas.surfboard import SurfboardCreate
from app.scripts.seed_dev_data import (
    SAMPLE_USERS,
    build_recent_sessions,
    _normalize_review,
    _parse_iso_datetime,
)
from app.scripts.seed_sri_lanka_west_spots import SPOTS
from app.services.surf_session_service import create_surf_session
from app.services.surfboard_service import create_surfboard
from app.services.spot_service import get_spot_by_name

# Global lock: only one demo reset at a time across all requests
_demo_reset_lock = asyncio.Lock()


async def reset_demo_data(db: AsyncSession, demo_user: User) -> None:
    """Wipe and re-seed all data for the demo user in a single DB session."""
    
    if _demo_reset_lock.locked():
        # A reset is currently in progress. Wait for it to finish and return.
        async with _demo_reset_lock:
            pass
        return

    async with _demo_reset_lock:
        user_id = demo_user.id

        # ── 1. Delete all user data ──────────────────────────────────────────
        # CASCADE should delete reviews automatically, but we delete them explicitly for reliability
        await db.execute(delete(SurfSessionReview).where(SurfSessionReview.user_id == user_id))
        await db.execute(delete(SurfSession).where(SurfSession.user_id == user_id))
        await db.execute(delete(Surfboard).where(Surfboard.owner_id == user_id))
        await db.commit()

        # ── 2. Find fixtures for the demo user ───────────────────────────────
        demo_fixture = next((u for u in SAMPLE_USERS if u["email"] == demo_user.email), None)
        if demo_fixture is None:
            raise RuntimeError(f"No seed fixture found for {demo_user.email}")

        # ── 3. Re-create boards directly in the DB ───────────────────────────
        board_lookup: dict[str, int] = {}
        for board_data in demo_fixture["surfboards"]:
            board = await create_surfboard(db, SurfboardCreate(**board_data), user_id)
            board_lookup[board_data["name"]] = board.id
        await db.commit()

        # ── 4. Generate and create sessions directly in the DB ─────────────
        board_names = list(board_lookup.keys())
        sessions = build_recent_sessions(SPOTS, board_names, count=20)

        # Fields that create_surf_session fills via get_weather_for_session.
        # Pre-seeded fixtures already contain these values, so we pass them
        # directly and skip the internal weather fetch to avoid duplicate-key errors.
        _WEATHER_FIELDS = {
            "wave_height_m", "wave_period", "wave_dir",
            "wind_speed_kmh", "wind_dir", "energy", "rating",
            "tide_height_m", "tide_low_m", "tide_high_m",
        }

        for session_payload in sessions:
            payload = dict(session_payload)

            # Resolve datetime
            dt = _parse_iso_datetime(payload.pop("datetime"))
            payload["datetime"] = dt

            # Resolve surfboard name → id
            surfboard_name = payload.pop("surfboard_name", None)
            if surfboard_name and surfboard_name in board_lookup:
                payload["surfboard_id"] = board_lookup[surfboard_name]

            # Extract and normalize review
            review_payload = payload.pop("review", None)
            if review_payload:
                review_payload = _normalize_review(review_payload, dt)

            # Resolve spot name → id
            spot_name = payload.pop("spot_name", None)
            if spot_name:
                spot = await get_spot_by_name(db, spot_name)
                if spot:
                    payload["spot_id"] = spot.id

            # Separate pre-filled weather fields so they are not duplicated
            # when create_surf_session merges its own get_weather_for_session result.
            weather_override = {k: payload.pop(k) for k in _WEATHER_FIELDS if k in payload}

            session = await create_surf_session(db, payload, user_id, review_data=review_payload)

            # Apply the pre-seeded weather values that the service skipped.
            if weather_override:
                for k, v in weather_override.items():
                    setattr(session, k, v)
                await db.commit()
