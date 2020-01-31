#!/bin/sh

PACKAGE_VERSION=$(cat ../../package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="smarties"
IMG_TAG="$PACKAGE_VERSION"

# Clean mac
#rm -Rf $HOME/Library/Containers/com.docker.docker/Data
# Kill Containers
docker kill $(docker ps -q)
# Clean images
docker image rm -f $(docker image ls -a -q "*/smarties")
docker system prune --all -f
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx create --use --append --name smarties
docker buildx build --platform linux/amd64,linux/arm/v7 --push -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG -f Dockerfile .
docker system prune --all -f
