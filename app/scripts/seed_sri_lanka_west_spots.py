import asyncio
from typing import Sequence

from app.scripts.seed_dev_data import ensure_spots

# Surf spots on Sri Lanka's west/south-west coast. Coordinates are approximate
# centroids near each break; difficulties left None to avoid misclassification.
SPOTS: Sequence[dict] = [
    {"name": "Weligama", "lat": 5.97501, "lon": 80.42968, "difficulty": [0], "surf_forecast_name": "Weligama"},
    {
        "name": "Main Point (Weligama)",
        "lat": 5.97501,
        "lon": 80.42968,
        "difficulty": [0, 1],
        "surf_forecast_name": "Main-Point-Weligama",
    },
    {
        "name": "Fishermans",
        "lat": 5.97501,
        "lon": 80.42968,
        "difficulty": [1, 2],
        "surf_forecast_name": "Fishermans-Sri-Lanka",
    },
    {"name": "Plantations", "lat": 5.96522, "lon": 80.39095, "difficulty": [1, 2], "surf_forecast_name": "Plantations"},
    {
        "name": "Coconuts",
        "lat": 5.96522,
        "lon": 80.39095,
        "difficulty": [1, 2, 3],
        "surf_forecast_name": "Coconuts-Sri-Lanka",
    },
    {"name": "Lazy Left", "lat": 5.96522, "lon": 80.39095, "difficulty": [1, 2, 3], "surf_forecast_name": "Lazy-Left"},
    {"name": "Rams Right", "lat": 5.96522, "lon": 80.39095, "difficulty": [2, 3], "surf_forecast_name": "Rams-Right"},
    {"name": "Dewata", "lat": 6.03073, "lon": 80.24041, "difficulty": [0,1], "surf_forecast_name": "Dewata"},
    {
        "name": "Madiha Left",
        "lat": 5.93754,
        "lon": 80.50767,
        "difficulty": [1, 2, 3],
        "surf_forecast_name": "Madiha-Left",
    },
    {
        "name": "Beach Break (Hikkaduwa)",
        "lat": 6.1407,
        "lon": 80.1012,
        "difficulty": [0, 1],
        "surf_forecast_name": "Beach-Break_Hikkaduwa",
    },
    {
        "name": "Bennys (Hikkaduwa)",
        "lat": 6.1407,
        "lon": 80.1012,
        "difficulty": [2, 3],
        "surf_forecast_name": "Bennys_Hikkaduwa",
    },
    {
        "name": "North Jetty (Hikkaduwa)",
        "lat": 6.1407,
        "lon": 80.1012,
        "difficulty": [1, 2],
        "surf_forecast_name": "North-Jetty_Hikkaduwa",
    },
    {
        "name": "Main Reef (Hikkaduwa)",
        "lat": 6.1407,
        "lon": 80.1012,
        "difficulty": [1, 2],
        "surf_forecast_name": "Main-Reef_Hikkaduwa",
    },
]


def _summarize(results: dict[str, str]) -> str:
    created = sum(1 for status in results.values() if status == "created")
    existing = sum(1 for status in results.values() if status == "existing")
    return f"created={created}, existing={existing}"


async def main() -> int:
    print("Seeding Sri Lanka West surf spots...")
    results = await ensure_spots(SPOTS)
    summary = _summarize(results)
    print(summary)
    for name, status in results.items():
        print(f"- {name}: {status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
