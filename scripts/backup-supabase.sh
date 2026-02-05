#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}/db"

echo "Creating PostgreSQL backup..."
pg_dump "${SUPABASE_DB_URL}" | gzip > "${BACKUP_DIR}/db/aerocrm-${STAMP}.sql.gz"

echo "Backup created: ${BACKUP_DIR}/db/aerocrm-${STAMP}.sql.gz"
