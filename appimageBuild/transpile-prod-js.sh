#!/usr/bin/env bash
set -e

# Stage 1: Install all dependencies and transpile the source code

yarn install --frozen-lockfile
yarn build

# Stage 2: Reinstall only non dev dependencies and copy the transpiled source code to the AppDir

yarn install --production --frozen-lockfile
