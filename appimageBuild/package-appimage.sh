#!/usr/bin/env bash
set -e

SCRIPT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

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

# As some node modules might have multiple architectures downloaded, we manually remove other
# architectures to make linuxdeploy work and smaller AppImage
appimageBuild/remove-other-architectures.sh

mkdir -p AppDir/nodeapp
mkdir -p AppDir/usr/etc
mkdir -p AppDir/usr/lib

cp -r dist AppDir/nodeapp
cp -r node_modules AppDir/nodeapp
cp -r resources AppDir/nodeapp
cp -r web AppDir/nodeapp
cp package.json AppDir/nodeapp
cp yarn.lock AppDir/nodeapp


cp -r /etc/ImageMagick-* AppDir/usr/etc
cp -r /usr/lib/$(dpkg-architecture -q DEB_HOST_MULTIARCH)/ImageMagick-* AppDir/usr/lib

"$SCRIPT_DIR/copy-needed-libraries.sh" AppDir

export NO_STRIP=true # Some files fail to strip for some reason
export LDAI_OUTPUT="eink.AppImage"

ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ]; then
    ARCH="x86_64"
elif [ "$ARCH" == "aarch64" ]; then
    # For some stupid reason, linuxdeploy doesn't recognize aarch64 as a valid architecture
    # and instead uses arm_aarch64 for the exactly same thing
    ARCH="arm_aarch64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi
export ARCH
NODE_PATH="$(command -v node)"
CONVERT_PATH="$(command -v convert)"
linuxdeploy --appdir AppDir --custom-apprun appimageResources/entrypoint.sh -e "$NODE_PATH" -e "$CONVERT_PATH" -d appimageResources/eink.desktop -i appimageResources/eink.png -o appimage -p checkrt | tee /dev/stderr
touch eink.AppImage
