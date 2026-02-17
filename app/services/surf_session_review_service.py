from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SurfSessionReview
from app.schemas.surf_session_review import SpotReviewSummaryResponse


def _weight_for_hours_diff(hours_diff: float) -> float:
    return 1.0 / (1.0 + abs(hours_diff))


def _weighted_metric_average(
    rows: Iterable[tuple[SurfSessionReview, float]],
    metric: str,
) -> float | None:
    weighted_total = 0.0
    weight_sum = 0.0
    for review, hours_diff in rows:
        value = getattr(review, metric)
        if value is None:
            continue
        weight = _weight_for_hours_diff(hours_diff)
        weighted_total += float(value) * weight
        weight_sum += weight
    if weight_sum == 0:
        return None
    return weighted_total / weight_sum


async def list_spot_reviews(
    db: AsyncSession,
    spot_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[SurfSessionReview]:
    result = await db.execute(
        select(SurfSessionReview)
        .where(SurfSessionReview.spot_id == spot_id)
        .order_by(desc(SurfSessionReview.observed_at))
        .offset(max(offset, 0))
        .limit(max(limit, 1))
    )
    return result.scalars().all()


async def get_recent_spot_reviews(
    db: AsyncSession,
    spot_id: int,
    limit: int = 3,
) -> list[SurfSessionReview]:
    return await list_spot_reviews(db, spot_id=spot_id, limit=limit, offset=0)


async def _get_reviews_for_date(
    db: AsyncSession,
    spot_id: int,
    target_date: date,
) -> list[SurfSessionReview]:
    """Fetch reviews for a specific spot on a specific date, filtered in SQL."""
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)
    
    result = await db.execute(
        select(SurfSessionReview)
        .where(
            SurfSessionReview.spot_id == spot_id,
            SurfSessionReview.observed_at >= start_of_day,
            SurfSessionReview.observed_at < end_of_day,
        )
        .order_by(desc(SurfSessionReview.observed_at))
    )
    return result.scalars().all()


def _compute_weighted_summary(
    reviews: list[SurfSessionReview],
    now_value: datetime,
) -> SpotReviewSummaryResponse:
    """Build a weighted summary from reviews already filtered to today."""
    if not reviews:
        return SpotReviewSummaryResponse(review_count=0)

    today_rows: list[tuple[SurfSessionReview, float]] = []
    for review in reviews:
        if review.observed_at is None:
            continue
        diff_hours = abs((now_value - review.observed_at).total_seconds()) / 3600
        today_rows.append((review, diff_hours))

    if not today_rows:
        return SpotReviewSummaryResponse(review_count=0)

    latest_observed_at = max(
        (r.observed_at for r, _ in today_rows if r.observed_at is not None),
        default=None,
    )

    return SpotReviewSummaryResponse(
        weighted_quality=_weighted_metric_average(today_rows, "quality"),
        avg_crowded_level=_weighted_metric_average(today_rows, "crowded_level"),
        avg_wave_height_index=_weighted_metric_average(today_rows, "wave_height_index"),
        avg_short_long_index=_weighted_metric_average(today_rows, "short_long_index"),
        avg_wind_index=_weighted_metric_average(today_rows, "wind_index"),
        review_count=len(today_rows),
        latest_observed_at=latest_observed_at,
    )


async def get_spot_review_summary(
    db: AsyncSession,
    spot_id: int,
    now: datetime | None = None,
) -> SpotReviewSummaryResponse:
    now_value = now or datetime.now(timezone.utc).replace(tzinfo=None)
    today_reviews = await _get_reviews_for_date(db, spot_id, now_value.date())
    return _compute_weighted_summary(today_reviews, now_value)
