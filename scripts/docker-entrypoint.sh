#!/bin/sh
set -e
export DATABASE_URL="${DATABASE_URL:-file:/app/data/portfolio.db}"

# A bind-mounted /app/data inherits the host directory's ownership, which may
# be root (Docker creates missing host dirs as root). Fix it, then drop
# privileges and re-run this script as the unprivileged app user.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown -R nextjs:nodejs /app/data
  exec su-exec nextjs "$0" "$@"
fi

./node_modules/.bin/prisma migrate deploy
# Seed only when the database is empty (preserves admin edits on restart)
if [ -f "./scripts/seed-if-empty.mjs" ]; then
  node ./scripts/seed-if-empty.mjs || true
fi
exec "$@"
