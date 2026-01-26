from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Dict, Optional

import httpx

from app.core.exceptions import ExternalAPIError


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
        try:
            resp = await self._http.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise ExternalAPIError(f"OpenMeteo Marine API error: {str(e)}", original_error=e)

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
        try:
            resp = await self._http.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise ExternalAPIError(f"OpenMeteo Weather API error: {str(e)}", original_error=e)

