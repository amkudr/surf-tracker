from datetime import date

import httpx
import pytest

from app.external_apis.openmeteo import OpenMeteoClient
from app.services.weather_service import get_surf_report


@pytest.mark.asyncio
async def test_get_surf_report_success_returns_normalized_dict():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert float(request.url.params["latitude"]) == 10.0
        assert float(request.url.params["longitude"]) == 20.0
        assert request.url.params["start_date"] == "2024-01-01"
        assert request.url.params["end_date"] == "2024-01-01"

        if request.url.host == "marine-api.open-meteo.com" and request.url.path == "/v1/marine":
            hourly = request.url.params["hourly"].split(",")
            assert {"wave_height", "wave_direction", "wave_period"}.issubset(hourly)

            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "time": ["2024-01-01T00:00"],
                        "wave_height": [1.2],
                        "wave_period": [7.5],
                        "wave_direction": [210],
                    }
                },
            )
        elif request.url.host == "api.open-meteo.com" and request.url.path == "/v1/forecast":
            hourly = request.url.params["hourly"].split(",")
            assert {"wind_speed_10m", "wind_direction_10m"}.issubset(hourly)

            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "time": ["2024-01-01T00:00"],
                        "wind_speed_10m": [5.5],
                        "wind_direction_10m": [190],
                    }
                },
            )
        else:
            raise ValueError(f"Unexpected URL: {request.url}")

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(transport=transport) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await get_surf_report(10, 20, date(2024, 1, 1), client=om_client)

    assert result == {
        "time": "2024-01-01T00:00",
        "wave_height": 1.2,
        "wave_period": 7.5,
        "wave_direction": 210,
        "wind_speed": 5.5,
        "wind_direction": 190,
    }


@pytest.mark.asyncio
async def test_get_surf_report_returns_none_on_api_error():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"message": "server error"})

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(
        transport=transport, base_url="https://marine-api.open-meteo.com"
    ) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await get_surf_report(10, 20, client=om_client)

    assert result is None


@pytest.mark.asyncio
async def test_get_weather_by_coordinates():
    """Test successful weather retrieval by coordinates with mocked API response."""
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "marine-api.open-meteo.com":
            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "time": ["2024-01-01T12:00"],
                        "wave_height": [2.1],
                        "wave_period": [8.2],
                        "wave_direction": [225],
                    }
                },
            )
        elif request.url.host == "api.open-meteo.com":
            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "time": ["2024-01-01T12:00"],
                        "wind_speed_10m": [12.5],
                        "wind_direction_10m": [180],
                    }
                },
            )
        else:
            raise ValueError(f"Unexpected URL: {request.url}")

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(transport=transport) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await get_surf_report(37.7749, -122.4194, date(2024, 1, 1), client=om_client)

    assert result == {
        "time": "2024-01-01T12:00",
        "wave_height": 2.1,
        "wave_period": 8.2,
        "wave_direction": 225,
        "wind_speed": 12.5,
        "wind_direction": 180,
    }


@pytest.mark.asyncio
async def test_weather_api_failure():
    """Test weather API failure due to timeout."""
    async def handler(request: httpx.Request) -> httpx.Response:
        # Simulate timeout by raising an exception
        raise httpx.TimeoutException("Request timed out")

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(transport=transport) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await get_surf_report(40.7128, -74.0060, date(2024, 1, 1), client=om_client)

    assert result is None


@pytest.mark.asyncio
async def test_weather_fallback_to_none():
    """Test that weather service falls back to None when API is completely down."""
    async def handler(request: httpx.Request) -> httpx.Response:
        # Simulate complete API failure
        raise httpx.ConnectError("Connection failed")

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(transport=transport) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await get_surf_report(51.5074, -0.1278, date(2024, 1, 1), client=om_client)

    assert result is None
