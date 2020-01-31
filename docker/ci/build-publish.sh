#!/bin/sh
docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="smarties-ci"
IMG_TAG="12.14-{dist}-1"

# Kill Containers
docker kill $(docker ps -q)
# Clean images
docker image rm -f $(docker image ls -a -q "*/smarties-ci")
docker system prune --all -f
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx create --use --append --name smarties-ci
docker buildx build --platform linux/amd64,linux/arm/v7 --push -t $DOCKER_ACC/$DOCKER_REPO:$(echo $IMG_TAG | sed -e s@{dist}@stretch@) -f Dockerfile-stretch .
docker buildx build --platform linux/amd64,linux/arm/v7 --push -t $DOCKER_ACC/$DOCKER_REPO:$(echo $IMG_TAG | sed -e s@{dist}@buster@) -f Dockerfile-buster .
docker system prune --all -f
