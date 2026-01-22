from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Dict, Optional

import httpx


class OpenMeteoClient:
    """
    Minimal async client for Open-Meteo marine + weather endpoints.
    """

    def __init__(self, http_client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the OpenMeteo client.
        
        Args:
            http_client: Optional httpx.AsyncClient for dependency injection (useful for testing).
                        If not provided, a new client will be created.
        """
        self._http = http_client if http_client is not None else httpx.AsyncClient(timeout=20)
        self._owns_client = http_client is None

    async def aclose(self) -> None:
        """Close the HTTP client if we own it."""
        if self._owns_client:
            await self._http.aclose()

    async def get_marine_hourly_forecast(
        self,
        lat: float,
        lon: float,
        start_date: date,
        end_date: date,
        timezone: str = "GMT",
    ) -> Dict[str, Any]:
        """
        Fetch hourly marine forecast (waves) for a given date range.
        Uses: https://marine-api.open-meteo.com/v1/marine
        """
        url = "https://marine-api.open-meteo.com/v1/marine"
        params = {
            "latitude": lat,
            "longitude": lon,
            # wave_* fields from the marine API
            "hourly": "wave_height,wave_period,wave_direction",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "timezone": timezone,
        }
        resp = await self._http.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_weather_hourly_forecast(
        self,
        lat: float,
        lon: float,
        start_date: date,
        end_date: date,
        timezone: str = "GMT",
    ) -> Dict[str, Any]:
        """
        Fetch hourly weather forecast (wind at 10m) for a given date range.
        Uses: https://api.open-meteo.com/v1/forecast
        """
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            # wind_* fields are documented as valid hourly variables
            "hourly": "wind_speed_10m,wind_direction_10m",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "timezone": timezone,
        }
        resp = await self._http.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_surf_report(
        self,
        lat: float,
        lon: float,
        target_date: Optional[date] = None,
        timezone: str = "GMT",
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
            
        Returns:
            Dictionary with normalized surf data for the first hour, or None on error.
            Keys: time, wave_height, wave_period, wave_direction, wind_speed, wind_direction
        """
        if target_date is None:
            from datetime import date as date_class
            target_date = date_class.today()
        
        try:
            # Make parallel calls to both APIs
            marine_data, weather_data = await asyncio.gather(
                self.get_marine_hourly_forecast(
                    lat, lon, target_date, target_date, timezone
                ),
                self.get_weather_hourly_forecast(
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
