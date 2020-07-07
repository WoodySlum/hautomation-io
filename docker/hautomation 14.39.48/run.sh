#!/bin/sh
HAUTOMATION_DATA=/Users/smizrahi/Downloads/hautomation
docker run -it --rm --privileged --network host -v /dev:/dev -v $HAUTOMATION_DATA/data/:/var/hautomation/data/ -v $HAUTOMATION_DATA/node_modules/:/var/hautomation/node_modules/ 19bccca0fce5 /bin/bash

# https://github.com/WoodySlum/Hautomation-io.git
