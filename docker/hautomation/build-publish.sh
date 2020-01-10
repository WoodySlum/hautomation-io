#!/bin/sh

PACKAGE_VERSION=$(cat ../../package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="hautomation"
IMG_TAG="$PACKAGE_VERSION"

docker buildx create --use
docker buildx build --push --platform linux/amd64,linux/arm/v7 -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG .
# docker build -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG .
# docker push $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG
