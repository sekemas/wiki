#!/usr/bin/env bash
# Make a PostgreSQL server reachable at $DATABASE_URL, starting one if it is not
# already running. Called by scripts/setup.sh, and safe to run on its own.
#
# Order of preference:
#   1. something already listening on the host and port  -> use it
#   2. Docker (docker-compose.yml, postgres:16)          -> `docker compose up -d`
#   3. a system PostgreSQL cluster (pg_ctlcluster)       -> start it and create
#                                                           the role and database
# Anything else is reported with the exact command to run, rather than guessed at.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:=postgresql://openpedia:openpedia@localhost:5432/openpedia?schema=public}"
export DATABASE_URL

# --- the pieces of DATABASE_URL this script needs ---------------------------
url_part() { # $1: sed capture to pull out of the URL
  printf '%s' "$DATABASE_URL" | sed -E "$1"
}
DB_HOST="$(url_part 's|^[a-zA-Z]+://([^@]*@)?(\[[^]]+\]|[^:/?]+).*|\2|')"
DB_PORT="$(printf '%s' "$DATABASE_URL" | sed -nE 's|^[a-zA-Z]+://([^@]*@)?(\[[^]]+\]|[^:/?]+):([0-9]+).*|\3|p')"
DB_USER="$(url_part 's|^[a-zA-Z]+://([^:/@]*)(:[^@]*)?@.*|\1|')"
DB_PASSWORD="$(printf '%s' "$DATABASE_URL" | sed -nE 's|^[a-zA-Z]+://[^:/@]*:([^@]*)@.*|\1|p')"
DB_NAME="$(printf '%s' "$DATABASE_URL" | sed -nE 's|^[^?]*/([^/?]+)(\?.*)?$|\1|p')"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-openpedia}"

tcp_open() { (exec 3<>"/dev/tcp/$1/$2") 2>/dev/null; }

wait_for_postgres() { # $1: seconds to wait
  for _ in $(seq 1 "$1"); do
    if tcp_open "$DB_HOST" "$DB_PORT"; then return 0; fi
    sleep 1
  done
  return 1
}

if tcp_open "$DB_HOST" "$DB_PORT"; then
  echo "Postgres already listening on ${DB_HOST}:${DB_PORT}"
  exit 0
fi

# --- 2. Docker ---------------------------------------------------------------
docker_ready() { command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; }

bootstrap_dockerd() {
  # The Docker CLI can be installed while the daemon is not running — the usual
  # state of a fresh sandbox. Two things stop it starting here: cgroup2 is not
  # mounted, and iptables cannot initialise nftables in this network namespace.
  # Both are fixable, and port publishing still works with the userland proxy.
  [ -x /usr/bin/dockerd ] || return 1
  echo "  starting the Docker daemon…"
  if [ ! -d /sys/fs/cgroup ] || [ -z "$(ls -A /sys/fs/cgroup 2>/dev/null)" ]; then
    sudo mkdir -p /sys/fs/cgroup 2>/dev/null || true
    sudo mount -t cgroup2 none /sys/fs/cgroup 2>/dev/null || true
  fi
  sudo mkdir -p /var/run/docker /var/lib/docker 2>/dev/null || true
  sudo sh -c 'setsid nohup dockerd > /tmp/openpedia-dockerd.log 2>&1 &' || true
  for _ in $(seq 1 15); do docker_ready && return 0; sleep 1; done
  echo "  retrying without iptables (no nftables in this namespace)…"
  sudo pkill -f 'dockerd' 2>/dev/null || true
  sleep 2
  sudo sh -c 'setsid nohup dockerd --iptables=false --ip6tables=false > /tmp/openpedia-dockerd.log 2>&1 &' || true
  for _ in $(seq 1 15); do docker_ready && return 0; sleep 1; done
  return 1
}

if command -v docker >/dev/null 2>&1; then
  if ! docker_ready; then bootstrap_dockerd || true; fi
  if docker_ready; then
    echo "Starting PostgreSQL 16 with docker compose…"
    if ! docker compose up -d --wait postgres 2>/dev/null; then
      docker compose up -d postgres
    fi
    if wait_for_postgres 60; then
      echo "Postgres is up on ${DB_HOST}:${DB_PORT}"
      exit 0
    fi
    echo "docker compose started, but nothing is listening on ${DB_HOST}:${DB_PORT}" >&2
  fi
fi

# --- 3. A system PostgreSQL cluster ------------------------------------------
if command -v pg_ctlcluster >/dev/null 2>&1; then
  VERSION="$(ls /usr/lib/postgresql 2>/dev/null | sort -n | tail -1)"
  if [ -n "${VERSION}" ]; then
    echo "Starting the system PostgreSQL ${VERSION} cluster…"
    sudo pg_ctlcluster "${VERSION}" main start 2>/dev/null || true
    if wait_for_postgres 30; then
      # The cluster is up; make sure the role and database exist.
      sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null |
        grep -q 1 ||
        sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD:-openpedia}' SUPERUSER" 2>/dev/null || true
      sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null |
        grep -q 1 ||
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}" 2>/dev/null || true
      echo "Postgres is up on ${DB_HOST}:${DB_PORT} (system cluster ${VERSION}/main)"
      exit 0
    fi
  fi
fi

cat >&2 <<'EOF'
No PostgreSQL server is running at DATABASE_URL, and this script could not start one.

Either start Docker and run:      docker compose up -d
or install PostgreSQL:            sudo apt-get install -y postgresql-16
then run this again.
EOF
exit 1
