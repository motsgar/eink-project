#!/usr/bin/env bash

set -e

IMAGE_NAME="temp-builder-image-$(date +%s)"

pushd build-environment
cp ../package.json ../yarn.lock .
docker buildx build --platform=linux/aarch64 -t "$IMAGE_NAME":latest . --load
rm package.json yarn.lock
popd

INPUT_FILES=(
    "appimageBuild"
    "appimageResources"
    "resources"
    "src"
    "web"
    ".nvmrc"
    "esbuild.mjs"
    "package.json"
    "tsconfig.json"
    "yarn.lock"
)
OUTPUT_FILES=("eink.AppImage" "AppDir")
DOCKER_DIR="/app"

echo "Cleaning output files"
for FILE in "${OUTPUT_FILES[@]}"; do
    rm -rf "$FILE"
done

CONTAINER_NAME="temp-builder-container-$(date +%s)"

docker create --name "$CONTAINER_NAME" --platform=linux/aarch64 "$IMAGE_NAME" ./appimageBuild/all.sh

echo "Copying input files to docker container"
for FILE in "${INPUT_FILES[@]}"; do
    docker cp "$FILE" "$CONTAINER_NAME:$DOCKER_DIR/"
done

echo "Starting container and running build script"
docker start -ai "$CONTAINER_NAME"

echo "Copying output files back to host"
for FILE in "${OUTPUT_FILES[@]}"; do
    docker cp "$CONTAINER_NAME:$DOCKER_DIR/$FILE" .
done

docker rm "$CONTAINER_NAME"

echo "Successfully built AppImage to ./eink.AppImage"
