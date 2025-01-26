#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"

"$SCRIPT_DIR/transpile-prod-js.sh"
"$SCRIPT_DIR/package-appimage.sh"
