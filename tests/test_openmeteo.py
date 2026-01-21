from datetime import date

import httpx
import pytest

from app.external_apis.openmeteo import OpenMeteoClient


@pytest.mark.asyncio
async def test_get_surf_report_success_returns_normalized_dict():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/marine"
        assert float(request.url.params["latitude"]) == 10.0
        assert float(request.url.params["longitude"]) == 20.0
        assert request.url.params["start_date"] == "2024-01-01"
        assert request.url.params["end_date"] == "2024-01-01"
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
                    "wind_speed_10m": [5.5],
                    "wind_direction_10m": [190],
                }
            },
        )

    transport = httpx.MockTransport(handler)

    async with httpx.AsyncClient(
        transport=transport, base_url="https://marine-api.open-meteo.com"
    ) as client:
        om_client = OpenMeteoClient(http_client=client)
        result = await om_client.get_surf_report(10, 20, date(2024, 1, 1))

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
        result = await om_client.get_surf_report(10, 20)

    assert result is None
