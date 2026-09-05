#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

while true; do
  npm run start:once -w supervisor
  code=$?

  if [ "$code" -eq 75 ]; then
    echo "[self-construct] supervisor updated; restarting with the new source..."
    continue
  fi

  exit "$code"
done
