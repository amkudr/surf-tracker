"""add surf_session_reviews table and move wave_quality

Revision ID: aa12bb34cc56
Revises: f7c2d8b9cabc
Create Date: 2026-02-14 11:30:00

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa12bb34cc56"
down_revision: Union[str, Sequence[str], None] = "f7c2d8b9cabc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("surf_session_reviews"):
        op.create_table(
            "surf_session_reviews",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("surf_session_id", sa.Integer(), nullable=False),
            sa.Column("spot_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("observed_at", sa.DateTime(), nullable=False),
            sa.Column("quality", sa.Integer(), nullable=False),
            sa.Column("crowded_level", sa.Integer(), nullable=True),
            sa.Column("wave_height_index", sa.Integer(), nullable=True),
            sa.Column("short_long_index", sa.Integer(), nullable=True),
            sa.Column("wind_index", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["surf_session_id"], ["surf_sessions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("surf_session_id"),
        )
        inspector = sa.inspect(bind)

    review_indexes = {idx["name"] for idx in inspector.get_indexes("surf_session_reviews")}
    if "ix_surf_session_reviews_spot_observed_at" not in review_indexes:
        op.create_index(
            "ix_surf_session_reviews_spot_observed_at",
            "surf_session_reviews",
            ["spot_id", "observed_at"],
            unique=False,
        )
    if "ix_surf_session_reviews_user_observed_at" not in review_indexes:
        op.create_index(
            "ix_surf_session_reviews_user_observed_at",
            "surf_session_reviews",
            ["user_id", "observed_at"],
            unique=False,
        )

    surf_session_columns = {column["name"] for column in inspector.get_columns("surf_sessions")}
    if "wave_quality" in surf_session_columns:
        op.execute(
            sa.text(
                """
                INSERT INTO surf_session_reviews (
                    surf_session_id,
                    spot_id,
                    user_id,
                    observed_at,
                    quality,
                    crowded_level,
                    wave_height_index,
                    short_long_index,
                    wind_index
                )
                SELECT
                    s.id,
                    s.spot_id,
                    s.user_id,
                    s.datetime,
                    s.wave_quality,
                    NULL,
                    NULL,
                    NULL,
                    NULL
                FROM surf_sessions AS s
                LEFT JOIN surf_session_reviews AS r
                    ON r.surf_session_id = s.id
                WHERE r.id IS NULL
                  AND s.wave_quality IS NOT NULL
                  AND s.spot_id IS NOT NULL
                  AND s.user_id IS NOT NULL
                """
            )
        )
        op.drop_column("surf_sessions", "wave_quality")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    surf_session_columns = {column["name"] for column in inspector.get_columns("surf_sessions")}
    if "wave_quality" not in surf_session_columns:
        op.add_column("surf_sessions", sa.Column("wave_quality", sa.Integer(), nullable=True))

    if inspector.has_table("surf_session_reviews"):
        op.execute(
            sa.text(
                """
                UPDATE surf_sessions
                SET wave_quality = (
                    SELECT review.quality
                    FROM surf_session_reviews AS review
                    WHERE review.surf_session_id = surf_sessions.id
                    ORDER BY review.id DESC
                    LIMIT 1
                )
                """
            )
        )

        review_indexes = {idx["name"] for idx in inspector.get_indexes("surf_session_reviews")}
        if "ix_surf_session_reviews_user_observed_at" in review_indexes:
            op.drop_index("ix_surf_session_reviews_user_observed_at", table_name="surf_session_reviews")
        if "ix_surf_session_reviews_spot_observed_at" in review_indexes:
            op.drop_index("ix_surf_session_reviews_spot_observed_at", table_name="surf_session_reviews")
        op.drop_table("surf_session_reviews")
