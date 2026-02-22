import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("status") == "ok"
    assert body.get("db") == "up"


@pytest.mark.asyncio
async def test_health_sets_request_id_header(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    assert resp.headers["X-Request-ID"]


@pytest.mark.asyncio
async def test_health_echoes_request_id_header(client):
    custom_id = "test-id-123"
    resp = await client.get("/health", headers={"X-Request-ID": custom_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_id
