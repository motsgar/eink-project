#!/usr/bin/env bash
set -e

ARCH=$(uname -m)
wget -O linuxdeploy.AppImage https://github.com/motsgar/linuxdeploy-plugin-argv0-fix/releases/download/continuous/linuxdeploy-${ARCH}.AppImage
wget -O appimage-type2-runtime https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-${ARCH}
wget -O linuxdeploy-plugin-checkrt.sh https://github.com/darealshinji/linuxdeploy-plugin-checkrt/releases/download/r1/linuxdeploy-plugin-checkrt.sh

# Patch the checkrt plugin to not crach if a user tries to run the appimage when it has a space character in its name
patch < linuxdeploy-plugin-checkrt.patch

# Patch the appimage to remove "magic bytes" that qemu thinks is a wrong binary format and doesn't execute in docker
sed -i 's|AI\x02|\x00\x00\x00|' linuxdeploy.AppImage

chmod +x linuxdeploy.AppImage
chmod +x linuxdeploy-plugin-checkrt.sh

./linuxdeploy.AppImage --appimage-extract
rm linuxdeploy.AppImage

mv squashfs-root /opt/linuxdeploy
mv appimage-type2-runtime /opt/linuxdeploy/type2-runtime
mv linuxdeploy-plugin-checkrt.sh /opt/linuxdeploy/linuxdeploy-plugin-checkrt.sh
mv /opt/linuxdeploy/AppRun /opt/linuxdeploy/linuxdeploy
