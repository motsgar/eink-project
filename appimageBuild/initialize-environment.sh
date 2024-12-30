#!/usr/bin/env bash
set -e

# node canvas dependencies
apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev

nvm install
npm install -g yarn
