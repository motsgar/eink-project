#!/usr/bin/env bash
set -e

# Stage 1: Install all dependencies and transpile the source code

yarn install --frozen-lockfile
yarn build

# Stage 2: Reinstall only non dev dependencies and copy the transpiled source code to the AppDir

yarn install --production --frozen-lockfile

mkdir -p AppDir/nodeapp
cp -r dist AppDir/nodeapp
cp -r node_modules AppDir/nodeapp
cp -r resources AppDir/nodeapp
cp -r web AppDir/nodeapp
cp package.json AppDir/nodeapp
cp yarn.lock AppDir/nodeapp
