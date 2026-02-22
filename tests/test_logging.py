import logging

import pytest

from app.core.exceptions import BusinessLogicError
from app.main import app

# Register a dedicated test route once
if not any(getattr(route, "path", "") == "/__raise_business_error" for route in app.router.routes):
    @app.get("/__raise_business_error")
    async def _raise_business_error():
        raise BusinessLogicError("boom", code="BOOM", status_code=418)


@pytest.mark.asyncio
async def test_business_logic_error_is_logged_with_request_id(client, caplog):
    caplog.set_level(logging.WARNING)
    resp = await client.get("/__raise_business_error", headers={"X-Request-ID": "req-xyz"})
    assert resp.status_code == 418

    records = [r for r in caplog.records if r.getMessage() == "business_logic_error"]
    assert records, "expected business_logic_error log"
    record = records[-1]
    assert getattr(record, "request_id", None) == "req-xyz"
    assert record.levelno == logging.WARNING
