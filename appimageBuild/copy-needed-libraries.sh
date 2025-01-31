#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <AppDir>"
    exit 1
fi

APPDIR="$1"
SCRIPT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

echo "Copying needed libraries to $APPDIR"

raw_libraries=(
    libpixman-1.so
    libcairo.so.2
    libjpeg.so.8
    libpango-1.0.so.0
    libgif.so.7
    librsvg-2.so.2
    libharfbuzz.so.0
)

libraries=()
lib_dirs=("/usr/lib" "/usr/lib/$(uname -m)-linux-gnu" "/usr/lib64")

echo "Filtering libraries"

for lib in "${raw_libraries[@]}"; do
    echo "Checking $lib"
    for dir in "${lib_dirs[@]}"; do
        echo "Checking $dir/$lib"
        if [ -f "$dir/$lib" ]; then
            echo "Found $dir/$lib"
            libraries+=("$dir/$lib")
            break
        fi
    done
done

# Copy all filtered libraries to the AppDir¨
mkdir -p "$APPDIR"/usr/lib
for library in "${libraries[@]}"; do
    echo "Copying $library"
    cp "$library" "$APPDIR"/usr/lib
done
