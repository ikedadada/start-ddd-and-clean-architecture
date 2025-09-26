# Backend Python

## Setup

1. Install Python and `uv` with `mise install`.
2. Install the project dependencies with `uv sync --frozen --group dev`.
3. Set the `DATABASE_URL` environment variable. When you use the MySQL container provided by Docker Compose, run `export DATABASE_URL="mysql://user:password@127.0.0.1:3306/todo_api"`. (When you start the service through Compose, the container sets this variable automatically.)
4. Start the FastAPI server with `docker compose up python`. Inside the container, the app is launched via `uv run uvicorn main:app --reload`.

## Local Development

- Run `DATABASE_URL=... uv run uvicorn main:app --reload --host 0.0.0.0 --port 3000` to start the development server with auto-reload from your host machine.
- Execute linting and formatting with `uv run ruff check .` and `uv run ruff format .`.

## Additional Notes

- After editing `pyproject.toml` or `uv.lock`, run `uv sync --frozen --group dev` to update dependencies.
- The virtual environment inside the Docker container lives at `/opt/uv-venv`, so it does not conflict with bind mounts from the host.
- If you work without Docker, start MySQL locally and apply `db/init.sql` to provision the required tables before running the API.
