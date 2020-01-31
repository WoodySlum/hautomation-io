#!/bin/sh
HAUTOMATION_DATA=$1
docker run -it --privileged -p 8053:8053 -p 8100:8100 -p 8101:8101 -v /dev:/dev -v $HAUTOMATION_DATA/data/:/var/smarties/data/ -v $HAUTOMATION_DATA/logs/:/var/log/smarties/ woodyslum/smarties:0.0.67 /bin/smarties
