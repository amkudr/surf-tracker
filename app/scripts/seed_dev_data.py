import argparse
import asyncio
from typing import Sequence

from app.database import async_session
from app.schemas.user import UserCreate
from app.services.spot_service import create_spot, get_spot_by_name
from app.services.user_service import create_user, get_user_by_email

DEFAULT_EMAIL = "demo@surf.local"
DEFAULT_PASSWORD = "surf1234"


async def ensure_demo_user(email: str, password: str) -> str:
    async with async_session() as session:
        existing = await get_user_by_email(session, email)
        if existing:
            return "existing"
        await create_user(session, UserCreate(email=email, password=password))
        return "created"


async def ensure_spots(spots: Sequence[dict]) -> dict:
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


async def main(email: str, password: str) -> int:
    print("Seeding development data...")

    user_result = await ensure_demo_user(email, password)
    spot_payload = [
        {
            "name": "Mavericks",
            "lat": 37.492,
            "lon": -122.497,
            "difficulty": [2, 3],
            "surf_forecast_name": "Mavericks",
        },
        {
            "name": "Pipeline",
            "lat": 21.664,
            "lon": -158.051,
            "difficulty": [2, 3],
            "surf_forecast_name": "Pipeline",
        },
        {
            "name": "Bondi Beach",
            "lat": -33.891,
            "lon": 151.277,
            "difficulty": [0, 1],
            "surf_forecast_name": "Bondi-Beach",
        },
    ]

    spot_results = await ensure_spots(spot_payload)

    print(f"User ({email}): {user_result}")
    for name, status in spot_results.items():
        print(f"Spot '{name}': {status}")

    print("Done")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed development data (demo user + sample spots)")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="Demo user email (default: %(default)s)")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Demo user password (default: %(default)s)")
    args = parser.parse_args()

    try:
        exit_code = asyncio.run(main(args.email, args.password))
    except Exception as exc:  # noqa: BLE001
        print(f"Seeding failed: {exc}")
        exit_code = 1
    raise SystemExit(exit_code)
