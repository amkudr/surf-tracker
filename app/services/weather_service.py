from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Dict, Optional

from app.external_apis import OpenMeteoClient


async def get_surf_report(
    lat: float,
    lon: float,
    target_date: Optional[date] = None,
    timezone: str = "GMT",
    client: Optional[OpenMeteoClient] = None,
) -> Optional[Dict[str, Any]]:
    """
    Get a surf report combining marine (wave) and weather (wind) data for a single date.
    Returns the first hour's data as a normalized dictionary, or None on error.

    Makes parallel calls to both the marine API (for wave data) and weather API (for wind data).

    Args:
        lat: Latitude
        lon: Longitude
        target_date: Target date (defaults to today if not provided)
        timezone: Timezone string (default: "GMT")
        client: Optional OpenMeteoClient instance for dependency injection (useful for testing).
                If not provided, a new client will be created.

    Returns:
        Dictionary with normalized surf data for the first hour, or None on error.
        Keys: time, wave_height, wave_period, wave_direction, wind_speed, wind_direction
    """
    if client is None:
        client = OpenMeteoClient()
        owns_client = True
    else:
        owns_client = False

    if target_date is None:
        from datetime import date as date_class
        target_date = date_class.today()

    try:
        # Make parallel calls to both APIs
        marine_data, weather_data = await asyncio.gather(
            client.get_marine_hourly_forecast(
                lat, lon, target_date, target_date, timezone
            ),
            client.get_weather_hourly_forecast(
                lat, lon, target_date, target_date, timezone
            ),
        )

        # Extract hourly data from marine API
        marine_hourly = marine_data.get("hourly", {})
        marine_times = marine_hourly.get("time", [])
        if not marine_times:
            return None

        # Extract hourly data from weather API
        weather_hourly = weather_data.get("hourly", {})

        # Get the first hour's data (both APIs use same parameters, so timestamps match)
        first_time = marine_times[0]
        wave_height_list = marine_hourly.get("wave_height", [])
        wave_period_list = marine_hourly.get("wave_period", [])
        wave_dir_list = marine_hourly.get("wave_direction", [])
        wind_speed_list = weather_hourly.get("wind_speed_10m", [])
        wind_dir_list = weather_hourly.get("wind_direction_10m", [])

        if not wave_height_list or not wave_period_list or not wave_dir_list:
            return None

        # Build normalized result
        result = {
            "time": first_time,
            "wave_height": wave_height_list[0],
            "wave_period": wave_period_list[0],
            "wave_direction": wave_dir_list[0],
            "wind_speed": wind_speed_list[0] if wind_speed_list else None,
            "wind_direction": wind_dir_list[0] if wind_dir_list else None,
        }

        return result
    except Exception:
        return None
    finally:
        if owns_client:
            await client.aclose()