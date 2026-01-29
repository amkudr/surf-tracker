import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.surfboard import Surfboard
from app.models.users import User
from app.schemas.surfboard import SurfboardCreate, SurfboardUpdate
from app.services.surfboard_service import (
    create_surfboard,
    get_surfboard_by_id,
    get_surfboards_by_owner_id,
    update_surfboard,
    delete_surfboard,
)
from app.core.security import hash_password


@pytest.mark.asyncio
async def test_create_surfboard_service_persists_and_links_owner(
    test_db: AsyncSession, test_user: User
) -> None:
    payload = SurfboardCreate(
        name="Shortboard",
        brand="Channel Islands",
        model="Happy Everyday",
        length_ft=6,
        volume_liters=32,
        owner_id=test_user.id,
    )

    created = await create_surfboard(test_db, payload, owner_id=test_user.id)

    assert isinstance(created, Surfboard)
    assert created.id is not None
    assert created.owner_id == test_user.id
    assert created.name == "Shortboard"
    assert created.length_ft == 6
    assert created.volume_liters == 32


@pytest.mark.asyncio
async def test_get_surfboards_by_owner_id_filters_properly(
    test_db: AsyncSession, test_user: User
) -> None:
    other_user = User(
        email="other@example.com",
        hashed_password=hash_password("otherpassword123"),
    )
    test_db.add(other_user)
    await test_db.commit()
    await test_db.refresh(other_user)

    mine = SurfboardCreate(
        name="My Board",
        brand="JS",
        model="Monsta",
        length_ft=6,
        volume_liters=30,
        owner_id=test_user.id,
    )
    theirs = SurfboardCreate(
        name="Their Board",
        brand="DHD",
        model="DNA",
        length_ft=6,
        volume_liters=31,
        owner_id=other_user.id,
    )

    await create_surfboard(test_db, mine, owner_id=test_user.id)
    await create_surfboard(test_db, theirs, owner_id=other_user.id)

    my_boards = await get_surfboards_by_owner_id(test_db, test_user.id)
    other_boards = await get_surfboards_by_owner_id(test_db, other_user.id)

    assert len(my_boards) == 1
    assert my_boards[0].owner_id == test_user.id
    assert my_boards[0].name == "My Board"

    assert len(other_boards) == 1
    assert other_boards[0].owner_id == other_user.id
    assert other_boards[0].name == "Their Board"


@pytest.mark.asyncio
async def test_update_surfboard_service_updates_only_provided_fields(
    test_db: AsyncSession, test_user: User
) -> None:
    payload = SurfboardCreate(
        name="Original",
        brand="Pyzel",
        model="Phantom",
        length_ft=6,
        volume_liters=33,
        owner_id=test_user.id,
    )
    created = await create_surfboard(test_db, payload, owner_id=test_user.id)

    update_payload = SurfboardUpdate(
        name="Updated",
        length_ft=7,
    )

    updated = await update_surfboard(test_db, created.id, update_payload)

    assert updated is not None
    assert updated.id == created.id
    assert updated.name == "Updated"
    assert updated.length_ft == 7
    # Unchanged fields
    assert updated.brand == "Pyzel"
    assert updated.model == "Phantom"
    assert updated.volume_liters == 33


@pytest.mark.asyncio
async def test_delete_surfboard_respects_owner_id(
    test_db: AsyncSession, test_user: User
) -> None:
    other_user = User(
        email="delete-other@example.com",
        hashed_password=hash_password("deletepassword123"),
    )
    test_db.add(other_user)
    await test_db.commit()
    await test_db.refresh(other_user)

    payload = SurfboardCreate(
        name="To Delete",
        brand="Rusty",
        model="Yes Thanks",
        length_ft=6,
        volume_liters=34,
        owner_id=test_user.id,
    )
    surfboard = await create_surfboard(test_db, payload, owner_id=test_user.id)

    wrong_owner_deleted = await delete_surfboard(test_db, surfboard.id, other_user.id)
    assert wrong_owner_deleted is False
    still_exists = await get_surfboard_by_id(test_db, surfboard.id)
    assert still_exists is not None

    correct_owner_deleted = await delete_surfboard(test_db, surfboard.id, test_user.id)
    assert correct_owner_deleted is True
    deleted = await get_surfboard_by_id(test_db, surfboard.id)
    assert deleted is None


@pytest.mark.asyncio
async def test_create_and_fetch_surfboard_via_api(authenticated_client, test_user: User) -> None:
    payload = {
        "name": "API Board",
        "brand": "Lost",
        "model": "Puddle Jumper",
        "length_ft": 5,
        "volume_liters": 28,
        "owner_id": test_user.id,
    }

    create_response = await authenticated_client.post("/surfboard/", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()

    assert created["id"] is not None
    assert created["name"] == "API Board"
    assert created["owner_id"] == test_user.id

    list_response = await authenticated_client.get("/surfboard/")
    assert list_response.status_code == 200
    boards = list_response.json()
    assert any(board["id"] == created["id"] for board in boards)

    get_response = await authenticated_client.get(f"/surfboard/{created['id']}")
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["id"] == created["id"]
    assert fetched["name"] == "API Board"


@pytest.mark.asyncio
async def test_update_and_delete_surfboard_via_api(authenticated_client, test_user: User) -> None:
    payload = {
        "name": "Updatable Board",
        "brand": "Firewire",
        "model": "Seaside",
        "length_ft": 5,
        "volume_liters": 29,
        "owner_id": test_user.id,
    }
    create_response = await authenticated_client.post("/surfboard/", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()

    update_payload = {
        "name": "Updated Board",
        "length_ft": 6,
    }
    update_response = await authenticated_client.put(
        f"/surfboard/{created['id']}", json=update_payload
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == created["id"]
    assert updated["name"] == "Updated Board"
    assert updated["length_ft"] == 6
    assert updated["brand"] == "Firewire"
    assert updated["model"] == "Seaside"
    assert updated["volume_liters"] == 29

    delete_response = await authenticated_client.delete(f"/surfboard/{created['id']}")
    assert delete_response.status_code == 204

    get_after_delete = await authenticated_client.get(f"/surfboard/{created['id']}")
    assert get_after_delete.status_code == 404

