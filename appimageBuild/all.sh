#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"

# source because we need to maintain the nvm environment
source "$SCRIPT_DIR/initialize-environment.sh"
source "$SCRIPT_DIR/transpile-prod-js.sh"
source "$SCRIPT_DIR/package-appimage.sh"
