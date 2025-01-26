#!/usr/bin/env bash
set -e

ARCH=$(uname -m)
wget -O linuxdeploy.AppImage https://github.com/motsgar/linuxdeploy-plugin-argv0-fix/releases/download/continuous/linuxdeploy-${ARCH}.AppImage
wget -O appimage-type2-runtime https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-${ARCH}
wget -O linuxdeploy-plugin-checkrt.sh https://github.com/darealshinji/linuxdeploy-plugin-checkrt/releases/download/continuous/linuxdeploy-plugin-checkrt.sh

# Patch the checkrt plugin to not crach if a user tries to run the appimage when it has a space character in its name
patch < linuxdeploy-plugin-checkrt.patch

chmod +x linuxdeploy.AppImage
chmod +x linuxdeploy-plugin-checkrt.sh

if [ "$ARCH" == "aarch64" ]; then
    echo "Installing qemu-user-static for aarch64"
    apt-get install -y qemu-user-static binfmt-support
    update-binfmts --enable qemu-aarch64
    qemu-aarch64-static ./linuxdeploy.AppImage --appimage-extract
    update-binfmts --disable qemu-aarch64
    apt-get remove -y qemu-user-static binfmt-support
else
    echo "using native architecture"
    ./linuxdeploy.AppImage --appimage-extract
fi
rm linuxdeploy.AppImage

mv squashfs-root /opt/linuxdeploy
mv appimage-type2-runtime /opt/linuxdeploy/type2-runtime
mv linuxdeploy-plugin-checkrt.sh /opt/linuxdeploy/linuxdeploy-plugin-checkrt.sh
mv /opt/linuxdeploy/AppRun /opt/linuxdeploy/linuxdeploy
