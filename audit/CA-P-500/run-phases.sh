#!/bin/sh
# Captures a true before/after pair on the same database, personas, widths and
# runtime by temporarily restoring the committed page, then putting the working
# tree version back. The trap guarantees the working tree is restored.
set -eu
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
AUDIT=audit/CA-P-500
NODE=${1:-$HOME/.nvm/versions/node/v24.20.0/bin/node}

git show HEAD:src/pages/500.astro > "$AUDIT/committed-500.astro"
cp src/pages/500.astro "$AUDIT/workingtree-500.astro"
restore() { cp "$AUDIT/workingtree-500.astro" src/pages/500.astro; }
trap restore EXIT INT TERM

wait_for() {
  i=0
  while [ "$i" -lt 60 ]; do
    if curl -s http://127.0.0.1:4331/500 | grep -q "$1"; then return 0; fi
    i=$((i + 1)); sleep 1
  done
  echo "marker not served: $1" >&2
  return 1
}

cp "$AUDIT/committed-500.astro" src/pages/500.astro
wait_for 'Request could not be completed'
"$NODE" audit/CA-04/local-run.mjs "$NODE" "$AUDIT/browser.mjs" before

restore
wait_for 'state-card__message'
"$NODE" audit/CA-04/local-run.mjs "$NODE" "$AUDIT/browser.mjs" after

