import argparse
import asyncio
import os
import sys

from app.core.exceptions import BusinessLogicError
from app.database import async_session
from app.services.user_service import create_admin_user, get_user_by_email


async def main() -> int:
    parser = argparse.ArgumentParser(description="Create an admin user (privileged path)")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument(
        "--token",
        required=True,
        help="Bootstrap token; must match ADMIN_BOOTSTRAP_TOKEN env",
    )

    args = parser.parse_args()

    expected_token = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not expected_token:
        print("ERROR: ADMIN_BOOTSTRAP_TOKEN env is not set", file=sys.stderr)
        return 1
    if args.token != expected_token:
        print("ERROR: invalid bootstrap token", file=sys.stderr)
        return 1

    async with async_session() as session:  # type: AsyncSession
        existing = await get_user_by_email(session, args.email)
        if existing:
            if existing.is_admin:
                print("Admin already exists for this email; nothing to do")
                return 0
            else:
                print("ERROR: user with this email exists and is not admin", file=sys.stderr)
                return 1

        try:
            await create_admin_user(session, args.email, args.password)
        except BusinessLogicError as exc:
            print(f"ERROR: {exc.message}", file=sys.stderr)
            return 1

    print("Admin user created successfully")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

