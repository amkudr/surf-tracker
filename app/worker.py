import asyncio
import os
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models.spot import Spot
from app.models.tide import Tide
from app.models.surf_forecast import SurfForecast
from app.services.scraper import SurfScraper

SCHEDULE_HOUR_MORNING = int(os.getenv("SCHEDULE_HOUR_MORNING", "6"))
SCHEDULE_HOUR_NIGHT = int(os.getenv("SCHEDULE_HOUR_NIGHT", "23"))

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
                    period=data["period"],
                    wind_speed=data["wind_speed"],
                    rating=data["rating"]
                )
                
                do_update_stmt = stmt.on_conflict_do_update(
                    constraint='uq_surf_forecast_spot_timestamp',
                    set_={
                        "wave_height": stmt.excluded.wave_height,
                        "period": stmt.excluded.period,
                        "wind_speed": stmt.excluded.wind_speed,
                        "rating": stmt.excluded.rating
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
    
    # Schedule jobs for Morning (6AM) and Night (11PM)
    scheduler.add_job(scrape_all_spots, 'cron', hour=SCHEDULE_HOUR_MORNING, minute=0)
    scheduler.add_job(scrape_all_spots, 'cron', hour=SCHEDULE_HOUR_NIGHT, minute=0)
    
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
