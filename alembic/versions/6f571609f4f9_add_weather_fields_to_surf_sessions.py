"""add weather fields to surf_sessions

Revision ID: 6f571609f4f9
Revises: 79b4afab838f
Create Date: 2026-01-21 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f571609f4f9'
down_revision: Union[str, Sequence[str], None] = '79b4afab838f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add weather data columns to surf_sessions table."""
    op.add_column('surf_sessions', sa.Column('wave_height_m', sa.Float(), nullable=True))
    op.add_column('surf_sessions', sa.Column('wave_period', sa.Float(), nullable=True))
    op.add_column('surf_sessions', sa.Column('wave_dir', sa.Integer(), nullable=True))
    op.add_column('surf_sessions', sa.Column('wind_speed_kmh', sa.Float(), nullable=True))
    op.add_column('surf_sessions', sa.Column('wind_dir', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Remove weather data columns from surf_sessions table."""
    op.drop_column('surf_sessions', 'wind_dir')
    op.drop_column('surf_sessions', 'wind_speed_kmh')
    op.drop_column('surf_sessions', 'wave_dir')
    op.drop_column('surf_sessions', 'wave_period')
    op.drop_column('surf_sessions', 'wave_height_m')
