#!/bin/bash

# Exit on any error
set -euo pipefail

# Get current architecture
ARCH=$(uname -m)

# Map system architecture to expected binary architecture strings
case "$ARCH" in
  "x86_64") EXPECTED_ARCH="x86-64" ;;
  "aarch64") EXPECTED_ARCH="ARM aarch64" ;;
  "armv7l") EXPECTED_ARCH="ARM" ;; # ARM 32-bit
  "i386") EXPECTED_ARCH="Intel 80386" ;; # x86 32-bit
  *) 
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

echo "Stripping binaries not matching architecture: $EXPECTED_ARCH"

# Find all files in node_modules that are ELF binaries
find node_modules -type f -exec file {} + | grep "ELF" | while IFS= read -r line; do
  FILE_PATH=$(echo "$line" | cut -d: -f1)
  FILE_ARCH=$(echo "$line" | grep -o "x86-64\|ARM aarch64\|ARM\|Intel 80386")

  # If the file architecture doesn't match the expected architecture, delete it
  if [[ "$FILE_ARCH" != "$EXPECTED_ARCH" ]]; then
    echo "Removing $FILE_PATH (arch: $FILE_ARCH)"
    rm -f "$FILE_PATH"
  fi
done

echo "Cleanup complete."