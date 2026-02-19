"""convert difficulty from enum array to integer array

Revision ID: 79b4afab838f
Revises: 1190b997a895
Create Date: 2026-01-21 14:57:54.522167

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '79b4afab838f'
down_revision: Union[str, Sequence[str], None] = '1190b997a895'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert difficulty column from enum array to integer array."""
    # Drop old CHECK constraint
    op.drop_constraint("ck_spots_difficulty_adjacent", "spots", type_="check")

    # Add temporary integer array column
    op.add_column("spots", sa.Column("difficulty_temp", postgresql.ARRAY(sa.Integer()), nullable=True))

    # Convert enum values to integers in temp column
    # Map: 'beginner'=0, 'intermediate'=1, 'advanced'=2, 'expert'=3
    op.execute("""
        UPDATE spots
        SET difficulty_temp = (
            SELECT ARRAY_AGG(
                CASE val::text
                    WHEN 'beginner' THEN 0
                    WHEN 'intermediate' THEN 1
                    WHEN 'advanced' THEN 2
                    WHEN 'expert' THEN 3
                END
                ORDER BY ordinality
            )
            FROM unnest(difficulty) WITH ORDINALITY AS val
        )
        WHERE difficulty IS NOT NULL
    """)

    # Drop old column and rename temp column
    op.drop_column("spots", "difficulty")
    op.alter_column("spots", "difficulty_temp", new_column_name="difficulty")

    # Create new CHECK constraint for integer arrays (0-3, adjacent only)
    # Validates: 1-3 values, all between 0-3, and values are adjacent (no gaps)
    op.create_check_constraint(
        "ck_spots_difficulty_adjacent",
        "spots",
        """
        difficulty IS NULL OR
        (array_length(difficulty, 1) BETWEEN 1 AND 3 AND
         difficulty <@ ARRAY[0,1,2,3]::INTEGER[] AND
         (array_length(difficulty, 1) = 1 OR
          (array_length(difficulty, 1) = 2 AND difficulty[2] = difficulty[1] + 1) OR
          (array_length(difficulty, 1) = 3 AND difficulty[2] = difficulty[1] + 1 AND difficulty[3] = difficulty[2] + 1)))
        """,
    )

    # Drop the enum type (only if no other tables use it)
    op.execute("DROP TYPE IF EXISTS spot_difficulty")


def downgrade() -> None:
    """Revert difficulty column back to enum array."""

    # Drop integer CHECK constraint
    op.drop_constraint("ck_spots_difficulty_adjacent", "spots", type_="check")

    # Recreate enum type
    spot_difficulty_enum = postgresql.ENUM(
        "beginner",
        "intermediate",
        "advanced",
        "expert",
        name="spot_difficulty",
        create_type=True,
    )
    spot_difficulty_enum.create(op.get_bind(), checkfirst=True)

    # Convert integers back to enum values
    op.execute("""
        UPDATE spots
        SET difficulty = (
            SELECT ARRAY_AGG(
                CASE val
                    WHEN 0 THEN 'beginner'::spot_difficulty
                    WHEN 1 THEN 'intermediate'::spot_difficulty
                    WHEN 2 THEN 'advanced'::spot_difficulty
                    WHEN 3 THEN 'expert'::spot_difficulty
                END
                ORDER BY ordinality
            )
            FROM unnest(difficulty) WITH ORDINALITY AS val
        )
        WHERE difficulty IS NOT NULL
    """)

    # Change column type back to enum array
    op.execute("ALTER TABLE spots ALTER COLUMN difficulty TYPE spot_difficulty[] USING difficulty::spot_difficulty[]")

    # Restore original CHECK constraint
    op.create_check_constraint(
        "ck_spots_difficulty_adjacent",
        "spots",
        """
        difficulty IS NULL OR
        difficulty = ARRAY['beginner']::spot_difficulty[] OR
        difficulty = ARRAY['intermediate']::spot_difficulty[] OR
        difficulty = ARRAY['advanced']::spot_difficulty[] OR
        difficulty = ARRAY['expert']::spot_difficulty[] OR
        difficulty = ARRAY['beginner','intermediate']::spot_difficulty[] OR
        difficulty = ARRAY['intermediate','advanced']::spot_difficulty[] OR
        difficulty = ARRAY['advanced','expert']::spot_difficulty[] OR
        difficulty = ARRAY['beginner','intermediate','advanced']::spot_difficulty[] OR
        difficulty = ARRAY['intermediate','advanced','expert']::spot_difficulty[]
        """,
    )
