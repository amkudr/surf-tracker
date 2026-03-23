from typing import Any

from fastapi import APIRouter, BackgroundTasks, status

router = APIRouter(prefix="/weather", tags=["weather"])

async def run_scrape_task():
    print("Manual scrape trigger is currently disabled in the backend.")

@router.post("/update", status_code=status.HTTP_202_ACCEPTED)
async def update_weather_forecast(background_tasks: BackgroundTasks) -> Any:
    background_tasks.add_task(run_scrape_task)
    return {"message": "Forecast update triggered in background."}
