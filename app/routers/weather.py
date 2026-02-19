from typing import Any

from fastapi import APIRouter, BackgroundTasks, status

from app.worker import scrape_all_spots

router = APIRouter(prefix="/weather", tags=["weather"])

async def run_scrape_task():
    try:
        await scrape_all_spots()
    except Exception as e:
        print(f"Error in manual scrape trigger: {e}")

@router.post("/update", status_code=status.HTTP_202_ACCEPTED)
async def update_weather_forecast(background_tasks: BackgroundTasks) -> Any:
    background_tasks.add_task(run_scrape_task)
    return {"message": "Forecast update triggered in background."}
