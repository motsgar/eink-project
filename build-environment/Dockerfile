FROM ghcr.io/motsgar/raspbian-docker:bookworm

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y

# Base dependencies
RUN apt-get install -y \
    build-essential \
    pkg-config \
    lsb-release

# Required tools
RUN apt-get install -y \
    wget \
    jq \
    pkg-config \
    file

# Install linuxdeploy and required appimage plugins
COPY appimage-linuxdeploy.sh appimage-linuxdeploy.sh
COPY linuxdeploy-plugin-checkrt.patch linuxdeploy-plugin-checkrt.patch
RUN chmod +x appimage-linuxdeploy.sh
RUN ./appimage-linuxdeploy.sh
RUN rm appimage-linuxdeploy.sh linuxdeploy-plugin-checkrt.patch

ENV LDAI_RUNTIME_FILE="/opt/linuxdeploy/type2-runtime"
ENV PATH="$PATH:/opt/linuxdeploy/"

# Application dependencies
RUN apt-get install -y \
    libpixman-1-dev \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    imagemagick \
    libpigpio-dev \
    pigpiod \
    python3

# Create home directory for node stuff really doesn't like running without one
RUN mkdir -p /home/builder/
RUN chmod -R 777 /home/builder/
ENV HOME=/home/builder

# Install Node.js
# The env is preset so it is accessible in the install-node.sh script
ENV PATH="/opt/node/bin:$PATH"
ENV npm_config_update-notifier=false
ENV NODE_VERSION=22.12.0
COPY install-node.sh install-node.sh
RUN chmod +x ./install-node.sh
RUN ./install-node.sh
RUN rm install-node.sh

RUN npm install -g yarn node-gyp

# Preinstall the dependencies to cache them
ENV YARN_CACHE_FOLDER=/yarn_cache
ENV npm_config_cache=/npm_cache

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --frozen-lockfile

RUN rm package.json yarn.lock
RUN rm -rf node_modules

# Clean up
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*
RUN apt-get autoremove -y
