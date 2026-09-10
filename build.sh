#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT_DIR/scripts/build.sh" "$@"
