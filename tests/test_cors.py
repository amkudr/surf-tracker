import pytest

ALLOWED_ORIGIN = "http://localhost:5173"
DENIED_ORIGIN = "http://evil.example"


@pytest.mark.asyncio
async def test_cors_preflight_allows_configured_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type,X-Request-ID",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN
    assert "GET" in response.headers.get("access-control-allow-methods", "")

    allow_headers = response.headers.get("access-control-allow-headers", "").lower()
    assert "authorization" in allow_headers
    assert "content-type" in allow_headers
    assert "x-request-id" in allow_headers


@pytest.mark.asyncio
async def test_cors_preflight_rejects_unconfigured_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": DENIED_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert response.headers.get("access-control-allow-origin") is None


@pytest.mark.asyncio
async def test_cors_simple_request_exposes_request_id_header(client):
    response = await client.get("/health", headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN
    assert "x-request-id" in response.headers.get("access-control-expose-headers", "").lower()
    assert response.headers.get("x-request-id")
