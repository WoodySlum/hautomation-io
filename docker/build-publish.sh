#!/bin/sh
docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="hautomation-ci"
IMG_TAG="10.14-1"

docker build -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG .
sudo docker push $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG
