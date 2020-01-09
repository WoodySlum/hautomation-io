#!/bin/sh
HAUTOMATION_DATA=$1
docker run -dit --privileged --network host -v /dev:/dev -v $HAUTOMATION_DATA/data/:/var/hautomation/data/ -v $HAUTOMATION_DATA/node_modules/:/var/hautomation/node_modules/ -v $HAUTOMATION_DATA/logs/:/var/log/hautomation/ woodyslum/hautomation:0.0.1 hautomation
