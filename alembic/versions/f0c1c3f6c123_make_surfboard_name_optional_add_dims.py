"""make surfboard name optional and add dimensions

Revision ID: f0c1c3f6c123
Revises: aba10a3d6785
Create Date: 2026-02-07 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0c1c3f6c123'
down_revision: Union[str, Sequence[str], None] = 'aba10a3d6785'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('surfboards', 'name', existing_type=sa.String(), nullable=True)
    op.alter_column('surfboards', 'volume_liters', existing_type=sa.Float(), nullable=True)
    op.add_column('surfboards', sa.Column('width_in', sa.Float(), nullable=True))
    op.add_column('surfboards', sa.Column('thickness_in', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('surfboards', 'thickness_in')
    op.drop_column('surfboards', 'width_in')
    op.alter_column('surfboards', 'volume_liters', existing_type=sa.Float(), nullable=False)
    op.alter_column('surfboards', 'name', existing_type=sa.String(), nullable=False)

