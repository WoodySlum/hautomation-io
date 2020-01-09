#!/bin/sh
docker login
DOCKER_ACC="woodyslum"
DOCKER_REPO="hautomation"
IMG_TAG="0.0.1"

docker build -t $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG .
# sudo docker push $DOCKER_ACC/$DOCKER_REPO:$IMG_TAG
