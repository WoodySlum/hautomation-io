#!/bin/sh
HAUTOMATION_DATA=$1
docker run -dit --privileged -p 8053:8053 -p 8100:8100 -p 8101:8101 --network host -v /dev:/dev -v $HAUTOMATION_DATA/data/:/var/hautomation/data/ -v $HAUTOMATION_DATA/logs/:/var/log/hautomation/ woodyslum/hautomation:0.0.1 hautomation
