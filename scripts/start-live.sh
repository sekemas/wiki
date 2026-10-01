#!/usr/bin/env bash
# Bring the live Openpedia site back up: PostgreSQL running, migrations applied,
# the site serving on port 3000.
#
# This is the ONE command to re-run after this computer is restarted or replaced:
#
#   bash scripts/start-live.sh              # start everything (builds only if needed)
#   bash scripts/start-live.sh --rebuild    # force a fresh vite build first
#
# It is idempotent — every step checks whether it is already done — so it is also
# safe to re-run on a healthy machine. It never reads a .env file: the connection
# string below is exported for the processes this script starts.
#
# WHAT SURVIVES A MACHINE REPLACEMENT AND WHAT DOES NOT
#   survives   /home/team/.data/pgdata.img  the whole database, in an ext4 image
#              /home/team/shared/site       the git repository
#   lost       /usr/lib/postgresql/16       the PostgreSQL binaries (apt-installed)
#              /opt/site/node_modules       the dependency tree (kept off /home)
#              /var/lib/openpedia-pg        the mount point of the image, recreated here
#              dist/                        the vite build, rebuilt here
#   `/home` is a small (300 MB) virtiofs mount that gives every file it holds to
#   user root, so a Postgres data directory cannot live there directly — Postgres
#   refuses to run as root and cannot own a directory on that filesystem. The
#   cluster therefore lives inside a sparse ext4 image file on /home, mounted at
#   /var/lib/openpedia-pg. The image is the persistent part; only the mount is not.
set -euo pipefail
cd "$(dirname "$0")/.."

PG_VERSION=16
PGBIN="/usr/lib/postgresql/${PG_VERSION}/bin"
PG_IMG=/home/team/.data/pgdata.img   # persistent: /home
PG_MNT=/var/lib/openpedia-pg          # ephemeral: overlay disk, just a mount point
PGDATA="${PG_MNT}/pgdata"
PG_HOST=127.0.0.1
PG_PORT=5432
DB_USER=openpedia
DB_PASSWORD=openpedia
DB_NAME=openpedia
: "${DATABASE_URL:=postgresql://${DB_USER}:${DB_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=public}"
export DATABASE_URL
# Keep bun's download cache off the tiny /home filesystem.
export BUN_INSTALL_CACHE_DIR="${BUN_INSTALL_CACHE_DIR:-/tmp/bun-cache}"

REBUILD=0
[ "${1:-}" = "--rebuild" ] && REBUILD=1

step() { printf '\n==> %s\n' "$1"; }
tcp_open() { (exec 3<>"/dev/tcp/$1/$2") 2>/dev/null; }
mounted() { grep -q " ${PG_MNT} " /proc/mounts; }

# --- 1. PostgreSQL binaries (apt-installed, so gone after a replacement) ------
step "PostgreSQL ${PG_VERSION} binaries in ${PGBIN}"
if [ ! -x "${PGBIN}/pg_ctl" ]; then
  echo "  installing postgresql-${PG_VERSION}"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    "postgresql-${PG_VERSION}" "postgresql-client-${PG_VERSION}"
else
  echo "  already installed"
fi

# --- 2. The persistent cluster image -----------------------------------------
step "database image ${PG_IMG} (/home, survives a replacement)"
if ! mounted; then
  sudo mkdir -p "${PG_MNT}"
  if [ ! -f "${PG_IMG}" ]; then
    echo "  no image found — creating a fresh 192 MB one (empty database)"
    sudo mkdir -p "$(dirname "${PG_IMG}")"
    # A sparse file: it only occupies the blocks the database actually uses.
    sudo dd if=/dev/zero of="${PG_IMG}" bs=1M count=1 seek=191 status=none
    sudo mkfs.ext4 -q -F -m 0 "${PG_IMG}"
  fi
  sudo mount -o loop "${PG_IMG}" "${PG_MNT}"
  echo "  mounted at ${PG_MNT}"
else
  echo "  already mounted at ${PG_MNT}"
fi
sudo mkdir -p /var/run/postgresql
sudo chown postgres:postgres /var/run/postgresql

# --- 3. The cluster itself ----------------------------------------------------
if [ ! -s "${PGDATA}/PG_VERSION" ]; then
  step "initialising a new cluster in ${PGDATA}"
  sudo mkdir -p "${PGDATA}"
  sudo chown postgres:postgres "${PGDATA}"
  sudo chmod 700 "${PGDATA}"
  sudo -u postgres "${PGBIN}/initdb" -D "${PGDATA}" \
    --auth-local=trust --auth-host=trust --encoding=UTF8 --locale=C >/dev/null
fi

step "PostgreSQL server on ${PG_HOST}:${PG_PORT}"
if tcp_open "${PG_HOST}" "${PG_PORT}"; then
  echo "  something is already listening"
else
  sudo -u postgres "${PGBIN}/pg_ctl" -D "${PGDATA}" -l /tmp/openpedia-postgres.log \
    -o "-c listen_addresses=${PG_HOST} -p ${PG_PORT} -k /var/run/postgresql" start >/dev/null
  for _ in $(seq 1 30); do
    tcp_open "${PG_HOST}" "${PG_PORT}" && break
    sleep 1
  done
  tcp_open "${PG_HOST}" "${PG_PORT}" || {
    echo "PostgreSQL did not start; see /tmp/openpedia-postgres.log" >&2
    exit 1
  }
  echo "  started"
fi

step "role ${DB_USER} and database ${DB_NAME}"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 ||
  sudo -u postgres psql -q -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}' SUPERUSER;"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 ||
  sudo -u postgres psql -q -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
echo "  ready"

# --- 4. Dependencies (off /home; gone after a replacement) --------------------
step "dependencies in /opt/site/node_modules"
sudo mkdir -p /opt/site
sudo chown "$(id -u):$(id -g)" /opt/site
if [ ! -d /opt/site/node_modules ]; then
  echo "  store is missing — it will be reinstalled"
  mkdir -p /opt/site/node_modules
fi
if [ -L node_modules ]; then
  [ -d node_modules ] || rm -f node_modules   # never leave a dangling symlink
fi
if [ ! -e node_modules ]; then
  ln -s /opt/site/node_modules node_modules
elif [ ! -L node_modules ]; then
  mv node_modules /opt/site/node_modules
  ln -s /opt/site/node_modules node_modules
fi
bun install
bunx prisma generate >/dev/null

# --- 5. Schema and content (all of it lives in the image) --------------------
step "applying committed migrations"
bunx prisma migrate deploy 2>&1 | grep -vE '^\s*[│┌└]' || true

step "loading the seed content (idempotent, upserts by slug)"
bun run db:seed 2>&1 | tail -6

# --- 6. Build and serve ------------------------------------------------------
step "build"
if [ "${REBUILD}" = 1 ] || [ ! -f dist/server/server.js ]; then
  bun run build
else
  echo "  dist/server/server.js exists — skipping (pass --rebuild to force)"
fi

step "starting the site on port 3000"
mkdir -p .run
# serve.ts frees port 3000 itself, whichever user owns the current listener, so
# re-running this script replaces the running server cleanly.
setsid nohup bun run serve.ts > .run/server.log 2>&1 < /dev/null &
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:3000/; then
    echo "  site is serving on port 3000"
    echo
    echo "Openpedia is up."
    echo "  local:   http://localhost:3000"
    echo "  public:  https://4228b4958f19d9dfc768fc57760a55ba.ctonew.app"
    exit 0
  fi
  sleep 0.5
done
echo "the server started but is not answering; see .run/server.log" >&2
exit 1
