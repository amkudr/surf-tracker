import asyncio
import os
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models.spot import Spot
from app.models.surf_forecast import SurfForecast
from app.models.tide import Tide
from app.services.scraper import SurfScraper

DEFAULT_START_HOUR = 5
DEFAULT_END_HOUR = 23
DEFAULT_PERIOD_HOURS = 4  # fixed step between runs

def build_schedule_hours() -> list[int]:
    """
    Build the list of hours (0-23) when the scraper should run.
    Uses only SCHEDULE_START_HOUR and SCHEDULE_END_HOUR env vars; period is fixed.
    Includes the end hour even if it is not aligned with the period.
    Supports windows that wrap past midnight.
    """
    try:
        start = int(os.getenv("SCHEDULE_START_HOUR", str(DEFAULT_START_HOUR)))
        end = int(os.getenv("SCHEDULE_END_HOUR", str(DEFAULT_END_HOUR)))
    except ValueError:
        print("Invalid schedule env values; using defaults.")
        start, end = DEFAULT_START_HOUR, DEFAULT_END_HOUR

    if not (0 <= start <= 23 and 0 <= end <= 23):
        print("Schedule hours must be between 0 and 23; using defaults.")
        start, end = DEFAULT_START_HOUR, DEFAULT_END_HOUR

    hours: list[int] = []
    current = start
    limit = end if start <= end else end + 24  # allow wrap over midnight

    while current <= limit:
        hour = current % 24
        if hour not in hours:
            hours.append(hour)
        current += DEFAULT_PERIOD_HOURS

    if end % 24 not in hours:
        hours.append(end % 24)

    return sorted(hours)

SCHEDULE_HOURS = build_schedule_hours()
SCHEDULE_HOURS_FIELD = ",".join(str(h) for h in SCHEDULE_HOURS)

def format_schedule_hours(hours: list[int]) -> str:
    return ", ".join(f"{h:02d}:00" for h in hours)

async def scrape_all_spots():
    print(f"[{datetime.now()}] Starting scrape job...")

    # 1. Initialize the scraper
    scraper = SurfScraper()
    await scraper.start()

    async with async_session() as session:
        # 2. Fetch all spots from the database
        result = await session.execute(select(Spot))
        spots = result.scalars().all()

        print(f"[{datetime.now()}] Found {len(spots)} spots to scrape.")

        # 3. Iterate over each spot
        for spot in spots:
            if not spot.surf_forecast_name:
                print(f"Skipping spot {spot.id}: No surf_forecast_name")
                continue

            # 4. Construct URL dynamically using the name
            spot_url = f"https://www.surf-forecast.com/breaks/{spot.surf_forecast_name}/forecasts/latest"

            print(f"Scraping spot {spot.id}: {spot.name} - {spot_url}")

            # 5. Perform the scraping
            # 5. Perform the scraping
            scrape_result = await scraper.scrape_spot(spot_url)
            forecasts = scrape_result.get("forecasts", [])
            tides = scrape_result.get("tides", [])

            if not forecasts and not tides:
                print(f"No data for spot {spot.id}")
                continue

            # 6. Save or Update (Upsert) Forecasts
            for data in forecasts:
                stmt = insert(SurfForecast).values(
                    spot_id=spot.id,
                    timestamp=data["timestamp"],
                    wave_height=data["wave_height"],
                    wave_direction=data["wave_direction"],
                    period=data["period"],
                    energy=data["energy"],
                    wind_speed=data["wind_speed"],
                    wind_direction=data["wind_direction"],
                    rating=data["rating"],
                    updated_at=datetime.utcnow()
                )

                do_update_stmt = stmt.on_conflict_do_update(
                    constraint='uq_surf_forecast_spot_timestamp',
                    set_={
                        "wave_height": stmt.excluded.wave_height,
                        "wave_direction": stmt.excluded.wave_direction,
                        "period": stmt.excluded.period,
                        "energy": stmt.excluded.energy,
                        "wind_speed": stmt.excluded.wind_speed,
                        "wind_direction": stmt.excluded.wind_direction,
                        "rating": stmt.excluded.rating,
                        "updated_at": datetime.utcnow()
                    }
                )

                await session.execute(do_update_stmt)

            # 7. Save or Update (Upsert) Tides
            for tide in tides:
                stmt = insert(Tide).values(
                    spot_id=spot.id,
                    timestamp=tide["timestamp"],
                    height=tide["height"],
                    tide_type=tide["tide_type"]
                )

                do_update_stmt = stmt.on_conflict_do_update(
                    constraint='uq_tide_spot_timestamp_type',
                    set_={
                        "height": stmt.excluded.height
                    }
                )

                await session.execute(do_update_stmt)

            await session.commit()
            print(f"Saved {len(forecasts)} forecasts and {len(tides)} tides for spot {spot.id}")

    # 7. Cleanup
    await scraper.stop()
    print(f"[{datetime.now()}] Scrape job completed.")

async def main():
    # 8. Setup Scheduler
    scheduler = AsyncIOScheduler()

    # Schedule jobs using configured hours (defaults: every ~4h from 05:00 through 23:00)
    scheduler.add_job(scrape_all_spots, 'cron', hour=SCHEDULE_HOURS_FIELD, minute=0)

    print(f"Scheduling scrapes at: {format_schedule_hours(SCHEDULE_HOURS)}")
    print("Starting Worker Scheduler...")
    scheduler.start()

    # Keep the process alive indefinitely using a more robust method
    # than run_forever, which allows for graceful handling if needed.
    try:
        while True:
            await asyncio.sleep(1000)
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        pass
