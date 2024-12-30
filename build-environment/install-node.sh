#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  if [ -z "$NODE_VERSION" ]; then
    echo "NODE_VERSION is not set. Please provide the node version as an argument."
    exit 1
  fi
else
  NODE_VERSION=$1
fi
ARCH=x64

if [ "$(uname -m)" == "aarch64" ]; then
  ARCH=arm64
fi

wget -O node.tar.xz https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz
tar -xf node.tar.xz
rm node.tar.xz
mv node-v${NODE_VERSION}-linux-${ARCH} /opt/node
# Envs already assumed to be preset in dockerfile
npm config set prefix /opt/node
