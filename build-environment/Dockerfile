FROM ubuntu:24.04

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y \
    build-essential \
    lsb-release \
    software-properties-common \
    wget \
    jq \
    pkg-config \
    libpixman-1-dev

#RUN add-apt-repository ppa:ubuntu-toolchain-r/test
#RUN apt-get update
#RUN apt-get install -y gcc-13 g++-13

COPY appimage-linuxdeploy.sh appimage-linuxdeploy.sh
COPY linuxdeploy-plugin-checkrt.patch linuxdeploy-plugin-checkrt.patch
RUN chmod +x appimage-linuxdeploy.sh
RUN ./appimage-linuxdeploy.sh
RUN rm appimage-linuxdeploy.sh linuxdeploy-plugin-checkrt.patch

ENV LDAI_RUNTIME_FILE="/opt/linuxdeploy/type2-runtime"
ENV PATH="$PATH:/opt/linuxdeploy/"
ENV CXX="g++-13"
ENV CC="gcc-13"

# Create home directory for node stuff really doesn't like running without one
RUN mkdir -p /home/builder/
RUN chmod -R 777 /home/builder/
ENV HOME=/home/builder

# Install NVM
ENV NVM_DIR=/nvm
RUN mkdir -p $NVM_DIR
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN chmod -R 777 $NVM_DIR

# Disable npm update notifier
ENV npm_config_update-notifier=false

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT [ "/docker-entrypoint.sh" ]
