#!/data/data/com.termux/files/usr/bin/bash
set -u

while true; do
  npm run start:once -w supervisor
  code=$?

  if [ "$code" -eq 75 ]; then
    echo "[self-construct] supervisor updated; restarting with the new source..."
    continue
  fi

  exit "$code"
done
