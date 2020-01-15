#!/bin/sh
docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="hautomation-ci"
IMG_TAG="12.14-1"


# Kill Containers
docker kill $(docker ps -q)
# Clean images
docker image rm -f $(docker image ls -a -q "*/hautomation-ci")
docker system prune --all -f
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx create --use --append --name hautomation-ci
docker buildx build --platform linux/amd64,linux/arm/v7 --push -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG -f Dockerfile .
docker system prune --all -f
