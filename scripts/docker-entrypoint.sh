#!/bin/sh
set -e
export DATABASE_URL="${DATABASE_URL:-file:/app/data/portfolio.db}"
mkdir -p /app/data
./node_modules/.bin/prisma migrate deploy
# Seed only when the database is empty (preserves admin edits on restart)
if [ -f "./scripts/seed-if-empty.mjs" ]; then
  node ./scripts/seed-if-empty.mjs || true
fi
exec "$@"
