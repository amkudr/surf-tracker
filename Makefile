PYTHON ?= python3
LINT_PATHS = app tests alembic
MYPY_PATHS = app/core app/schemas

.PHONY: install-dev lint format pre-commit-install pre-commit-update

install-dev:
	uv pip install -e ".[api,worker,dev]"

seed-demo:
	uv run python -m app.scripts.seed_dev_data

lint:
	ruff check $(LINT_PATHS)
	black --check $(LINT_PATHS)
	mypy $(MYPY_PATHS)

format:
	ruff check --fix $(LINT_PATHS)
	black $(LINT_PATHS)

pre-commit-install:
	pre-commit install

pre-commit-update:
	pre-commit autoupdate
