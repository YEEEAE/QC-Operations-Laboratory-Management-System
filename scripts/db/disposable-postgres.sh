#!/usr/bin/env bash
# Disposable PostgreSQL 18 cluster for database runtime verification.
#
# This is the "approved equivalent disposable environment" for hosts without a
# container runtime. It is strictly local and strictly disposable:
#   - every file lives under .tmp/ (gitignored),
#   - it never reads DATABASE_URL or any provider credential,
#   - it refuses to run against an existing PGDATA or a non-empty target.
#
# Usage:
#   scripts/db/disposable-postgres.sh provision   # create + start + print URLs
#   scripts/db/disposable-postgres.sh status
#   scripts/db/disposable-postgres.sh stop
#
# Then, in the same shell:
#   export DATABASE_URL="<printed DATABASE_URL>"
#   export QC_TEST_DATABASE_URL="<printed QC_TEST_DATABASE_URL>"
#   pnpm db:preflight && pnpm db:migrate && pnpm db:schema:check
#   pnpm test:integration && pnpm test:migrations && pnpm test:concurrency
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_ROOT="$ROOT/.tmp/pg18"
DATA="$TMP_ROOT/data"
SOCK="$TMP_ROOT/sock"
CERT="$TMP_ROOT/tls"
LOG="$TMP_ROOT/postgres.log"
PORT="${QC_PG18_PORT:-55432}"
PGBIN="${QC_PG18_BIN:-/opt/homebrew/opt/postgresql@18/bin}"
DB_OWNER="qc_owner"

fail() {
  echo "disposable-postgres: $*" >&2
  exit 1
}

require_pg18() {
  [ -x "$PGBIN/postgres" ] || fail "PostgreSQL 18 binaries not found at $PGBIN (override with QC_PG18_BIN)."
  # "postgres (PostgreSQL) 18.6 (Homebrew)" and "PostgreSQL 18.6" are both valid spellings.
  if ! "$PGBIN/postgres" --version | grep -qE 'PostgreSQL\)? 18\.'; then
    fail "expected PostgreSQL 18 at $PGBIN, found: $("$PGBIN/postgres" --version)"
  fi
}

running() {
  [ -f "$DATA/postmaster.pid" ] && "$PGBIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1
}

# --- TLS: throwaway local CA + localhost leaf --------------------------------
generate_certificates() {
  rm -rf "$CERT"
  mkdir -p "$CERT"

  openssl req -x509 -newkey rsa:2048 -nodes -days 3 \
    -keyout "$CERT/ca.key" -out "$CERT/ca.crt" \
    -subj "/CN=QC Disposable Local CA" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" >/dev/null 2>&1

  openssl req -newkey rsa:2048 -nodes \
    -keyout "$CERT/server.key" -out "$CERT/server.csr" \
    -subj "/CN=localhost" >/dev/null 2>&1

  printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n' \
    >"$CERT/server.ext"

  # `-CAserial` is set explicitly: without it openssl writes the serial file
  # into the current working directory (and leaves it in the repository root).
  openssl x509 -req -in "$CERT/server.csr" \
    -CA "$CERT/ca.crt" -CAkey "$CERT/ca.key" \
    -CAserial "$CERT/ca.srl" -CAcreateserial \
    -out "$CERT/server.crt" -days 3 -extfile "$CERT/server.ext" >/dev/null 2>&1

  chmod 600 "$CERT/server.key" "$CERT/ca.key" "$CERT/server.csr"
  rm -f "$CERT/server.csr" "$CERT/server.ext" "$CERT/ca.srl"
}

provision() {
  require_pg18
  running && fail "a cluster is already running at $DATA; run '$0 stop' first."

  rm -rf "$DATA" "$SOCK"
  mkdir -p "$DATA" "$SOCK"
  generate_certificates

  "$PGBIN/initdb" -D "$DATA" -U "$DB_OWNER" \
    --auth-local=trust --auth-host=trust \
    --encoding=UTF8 --locale=C >/dev/null

  cat >>"$DATA/postgresql.conf" <<EOF

# Disposable verification cluster. Local connections only.
port = $PORT
listen_addresses = '127.0.0.1'
unix_socket_directories = '$SOCK'
ssl = on
ssl_cert_file = '$CERT/server.crt'
ssl_key_file = '$CERT/server.key'
fsync = off
synchronous_commit = off
full_page_writes = off
max_connections = 120
dynamic_shared_memory_type = 'mmap'
EOF

  "$PGBIN/pg_ctl" -D "$DATA" -l "$LOG" -w -t 60 start >/dev/null

  "$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" -U "$DB_OWNER" qc_disposable
  "$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" -U "$DB_OWNER" qc_test

  # The canonical connection policy rejects sslmode=disable and verifies the
  # server certificate, so the URLs carry verify-full against the local CA.
  local common="sslmode=verify-full&sslrootcert=$CERT/ca.crt"
  echo "DISPOSABLE POSTGRESQL: $("$PGBIN/postgres" --version)"
  echo "export DATABASE_URL=\"postgresql://$DB_OWNER@localhost:$PORT/qc_disposable?$common\""
  echo "export QC_TEST_DATABASE_URL=\"postgresql://$DB_OWNER@localhost:$PORT/qc_test?$common\""
}

status() {
  require_pg18
  if running; then
    echo "running: port $PORT, data $DATA"
  else
    echo "not running"
  fi
}

stop() {
  require_pg18
  if running; then
    "$PGBIN/pg_ctl" -D "$DATA" -m immediate -w -t 60 stop >/dev/null
  fi
  rm -rf "$TMP_ROOT"
  echo "disposable cluster stopped and removed"
}

case "${1:-}" in
  provision) provision ;;
  status) status ;;
  stop) stop ;;
  *) fail "usage: $0 {provision|status|stop}" ;;
esac
