# Backend Python

## セットアップ

1. `mise install` で Python と uv をインストールします。
2. `cp .env.example .env` を実行し、必要であれば値を編集します。
3. `uv sync --frozen --group dev` を実行して依存関係をインストールします。
4. `docker compose up python` で FastAPI サーバーを起動します（コンテナ内では `uv run uvicorn main:app --reload` を使用）。

## ローカル開発

- `uv run uvicorn main:app --reload --host 0.0.0.0 --port 3000` でホットリロード付きの開発サーバーを起動できます。
- `uv run ruff check .` や `uv run ruff format .` を使って Lint / フォーマットを実行できます。

## 補足

- 依存関係は `pyproject.toml` と `uv.lock` を編集した後に `uv sync --frozen --group dev` で更新してください。
- Docker コンテナ内の仮想環境は `/opt/uv-venv` に配置されるため、ホストからのボリュームマウントと衝突しません。
