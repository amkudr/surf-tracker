import argparse
import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Sequence

from sqlalchemy import select

from app.database import async_session
from app.models import SurfSession
from app.schemas.surfboard import SurfboardCreate
from app.schemas.user import UserCreate
from app.services.spot_service import create_spot, get_spot_by_name
from app.services.surf_session_service import create_surf_session
from app.services.surfboard_service import create_surfboard, get_surfboards_by_owner_id
from app.services.user_service import create_user, get_user_by_email

# Sample fixtures used when --sample-data is enabled (default).
SAMPLE_USERS: Sequence[dict] = [
    {
        "email": "demo@surf.local",
        "password": "surf1234",
        "surfboards": [
            {
                "name": "Fish",
                "brand": "Lost",
                "model": "RNF Retro",
                "length_ft": 5.8,
                "width_in": 20.25,
                "thickness_in": 2.44,
                "volume_liters": 30.5,
            },
            {
                "name": "Step Up",
                "brand": "JS",
                "model": "Monsta 2020",
                "length_ft": 6.4,
                "width_in": 19.25,
                "thickness_in": 2.55,
                "volume_liters": 32.8,
            },
        ],
        "sessions": [],  # filled dynamically
    },
    {
        "email": "lena@surf.local",
        "password": "surf1234",
        "surfboards": [
            {
                "name": "Mid Length",
                "brand": "Firewire",
                "model": "Seaside & Beyond",
                "length_ft": 7.0,
                "width_in": 21.5,
                "thickness_in": 2.75,
                "volume_liters": 45.0,
            },
        ],
        "sessions": [],  # filled dynamically
    },
]


def _parse_iso_datetime(value: str | datetime) -> datetime:
    return value if isinstance(value, datetime) else datetime.fromisoformat(value)


def _normalize_review(review_payload: dict, fallback_dt: datetime) -> dict:
    """Ensure review payload has datetime objects for observed_at."""
    observed_raw = review_payload.get("observed_at") or fallback_dt
    review_payload["observed_at"] = _parse_iso_datetime(observed_raw)
    return review_payload


async def ensure_user(email: str, password: str):
    async with async_session() as session:
        existing = await get_user_by_email(session, email)
        if existing:
            return existing, "existing"
        created = await create_user(session, UserCreate(email=email, password=password))
        return created, "created"


async def ensure_spots(spots: Sequence[dict]) -> dict[str, str]:
    results: dict[str, str] = {}
    async with async_session() as session:
        for spot in spots:
            existing = await get_spot_by_name(session, spot["name"])
            if existing:
                results[spot["name"]] = "existing"
                continue
            await create_spot(
                session,
                name=spot["name"],
                lat=spot.get("lat"),
                lon=spot.get("lon"),
                difficulty=spot.get("difficulty"),
                surf_forecast_name=spot.get("surf_forecast_name"),
            )
            results[spot["name"]] = "created"
    return results


async def ensure_surfboards(owner_id: int, surfboards: Sequence[dict]) -> dict[str, tuple[int, str]]:
    results: dict[str, tuple[int, str]] = {}
    async with async_session() as session:
        existing = await get_surfboards_by_owner_id(session, owner_id)
        existing_map = {
            (
                (sb.name or "").lower(),
                (sb.brand or "").lower(),
                (sb.model or "").lower(),
                round(sb.length_ft, 2),
            ): sb
            for sb in existing
        }

        for board in surfboards:
            key = (
                (board.get("name") or "").lower(),
                (board.get("brand") or "").lower(),
                (board.get("model") or "").lower(),
                round(float(board["length_ft"]), 2),
            )
            if key in existing_map:
                sb = existing_map[key]
                results[board.get("name") or f"surfboard-{sb.id}"] = (sb.id, "existing")
                continue

            created = await create_surfboard(session, SurfboardCreate(**board), owner_id)
            lookup_name = board.get("name") or f"surfboard-{created.id}"
            results[lookup_name] = (created.id, "created")
    return results


async def ensure_surf_sessions(
    user_id: int,
    sessions: Sequence[dict],
    surfboard_lookup: dict[str, int],
) -> dict[str, str]:
    results: dict[str, str] = {}
    async with async_session() as session:
        for idx, session_payload in enumerate(sessions, start=1):
            payload = dict(session_payload)
            dt = _parse_iso_datetime(payload.pop("datetime"))
            payload["datetime"] = dt

            surfboard_name = payload.pop("surfboard_name", None)
            if surfboard_name:
                surfboard_id = surfboard_lookup.get(surfboard_name)
                if surfboard_id is None:
                    raise ValueError(f"Surfboard '{surfboard_name}' not found for user_id={user_id}")
                payload["surfboard_id"] = surfboard_id

            review_payload = payload.pop("review", None)
            if not review_payload:
                review_payload = {
                    "observed_at": dt,
                    "quality": 6 + (idx % 5),           # 6–10
                    "crowded_level": 2 + (idx % 4),     # 2–5
                    "wave_height_index": 3 + (idx % 5), # 3–7
                    "short_long_index": 4 + (idx % 3),  # 4–6
                    "wind_index": 3 + (idx % 5),        # 3–7
                }
            review_payload = _normalize_review(review_payload, dt)

            label = f"{dt.isoformat()} @ {payload.get('spot_name')}"
            existing = await session.execute(
                select(SurfSession).where(
                    SurfSession.user_id == user_id,
                    SurfSession.datetime == dt,
                )
            )
            if existing.scalar_one_or_none():
                results[label] = "existing"
                continue

            await create_surf_session(session, payload, user_id, review_data=review_payload)
            results[label] = "created"
    return results


def load_spots(spots_path: Path) -> list[dict]:
    """Load a list of spot payloads from a JSON file."""

    payload = json.loads(spots_path.read_text())
    if not isinstance(payload, list):
        raise ValueError("--spots-json must contain a JSON array of spot objects")
    return payload


def build_feb_sessions(spots: Sequence[dict], surfboard_names: list[str], count: int = 20) -> list[dict]:
    """Build deterministic surf sessions in February 2026 cycling through spots and quiver."""

    sessions: list[dict] = []
    base_dt = datetime(2026, 2, 1, 7, 0)
    for i in range(count):
        spot = spots[i % len(spots)]
        surfboard_name = surfboard_names[i % len(surfboard_names)]
        dt = base_dt + timedelta(days=i, minutes=5 * (i % 6))
        sessions.append(
            {
                "spot_name": spot["name"],
                "datetime": dt.isoformat(),
                "duration_minutes": 60 + (i % 5) * 10,  # 60–100 mins
                "notes": f"Auto-seeded session {i+1} at {spot['name']} (Feb 2026).",
                "surfboard_name": surfboard_name,
                "review": {
                    "observed_at": dt,
                    "quality": 6 + (i % 5),           # 6–10
                    "crowded_level": 2 + (i % 4),     # 2–5
                    "wave_height_index": 3 + (i % 5), # 3–7
                    "short_long_index": 4 + (i % 3),  # 4–6
                    "wind_index": 3 + (i % 5),        # 3–7
                },
            }
        )
    return sessions


async def seed_sample_data() -> None:
    from app.scripts.seed_sri_lanka_west_spots import SPOTS as SRI_LANKA_SPOTS

    print("Seeding Sri Lanka west coast spots...")
    spot_results = await ensure_spots(SRI_LANKA_SPOTS)
    created = sum(1 for status in spot_results.values() if status == "created")
    existing = sum(1 for status in spot_results.values() if status == "existing")
    print(f"  spots: created={created}, existing={existing}")

    for user_data in SAMPLE_USERS:
        user, user_status = await ensure_user(user_data["email"], user_data["password"])
        print(f"User ({user.email}): {user_status}")

        surfboard_results = await ensure_surfboards(user.id, user_data["surfboards"])
        board_lookup = {name: board_id for name, (board_id, _) in surfboard_results.items()}
        print("  Surfboards:")
        for name, (_, status) in surfboard_results.items():
            print(f"  - {name}: {status}")

        surfboard_names_in_quiver = list(board_lookup.keys())
        sessions = user_data["sessions"]
        if not sessions:
            sessions = build_feb_sessions(SRI_LANKA_SPOTS, surfboard_names_in_quiver, count=20)

        session_results = await ensure_surf_sessions(user.id, sessions, board_lookup)
        print("  Surf sessions:")
        for label, status in session_results.items():
            print(f"  - {label}: {status}")


async def main(email: str | None, password: str | None, spots_path: Path | None, sample_data: bool) -> int:
    print("Seeding development data...")

    if email and not password:
        raise ValueError("--password is required when seeding a user (--email)")

    if sample_data:
        await seed_sample_data()
    else:
        print("Sample data skipped (--no-sample-data)")

    if spots_path:
        spot_payload = load_spots(spots_path)
        spot_results = await ensure_spots(spot_payload)
        for name, status in spot_results.items():
            print(f"Spot '{name}': {status}")

    if email:
        user, status = await ensure_user(email, password)  # type: ignore[arg-type]
        print(f"User ({email}): {status}")

    print("Done")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed development data (users, surfboards, sessions, spots)")
    parser.add_argument("--email", help="User email to seed (optional)")
    parser.add_argument("--password", help="Password for seeded user (required if --email is set)")
    parser.add_argument(
        "--spots-json",
        type=Path,
        help="Path to a JSON file with an array of spot objects to seed (optional)",
    )
    parser.add_argument(
        "--sample-data",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Seed Sri Lanka spots plus sample users, surfboards, and sessions (default: enabled)",
    )
    args = parser.parse_args()

    try:
        exit_code = asyncio.run(main(args.email, args.password, args.spots_json, args.sample_data))
    except Exception as exc:  # noqa: BLE001
        print(f"Seeding failed: {exc}")
        exit_code = 1
    raise SystemExit(exit_code)
