#!/usr/bin/env bash
set -e

# Check that linuxdeploy and required plugins are available
if ! command -v linuxdeploy &> /dev/null; then
    echo "linuxdeploy not found in PATH"
    exit 1
fi

# Check that the required plugins are available
if ! linuxdeploy --list-plugins 2>/dev/null | grep -q appimage; then
    echo "linuxdeploy-plugin-appimage not found"
    exit 1
fi
if ! linuxdeploy --list-plugins 2>/dev/null | grep -q checkrt; then
    echo "linuxdeploy-plugin-checkrt not found"
    exit 1
fi

export NO_STRIP=true # Some files fail to strip for some reason
export LDAI_OUTPUT="eink.AppImage"

NODE_PATH="$(command -v node)"

# As some node modules might have multiple architectures downloaded, we need to specify explicitly for linuxdeploy what architecture to use
export ARCH=$(uname -m)
linuxdeploy --appdir AppDir  --custom-apprun appimageResources/entrypoint.sh -e "$NODE_PATH" -d appimageResources/eink.desktop -i appimageResources/eink.png -o appimage -p checkrt
