FROM node:12.14-buster

ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Global install
RUN apt-get update
RUN apt-get install -y --allow-unauthenticated sqlite3 libmagic-dev libatlas-base-dev libudev-dev apt-utils net-tools imagemagick graphicsmagick ffmpeg git sudo python-pip python3-pip alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox mplayer festival festvox-kallpc16k at lsb-release avrdude socat gammu gammu-smsd && apt-get clean

# Deconz global
RUN apt-get install -y curl kmod libcap2-bin libqt5core5a libqt5gui5 libqt5network5 libqt5serialport5 libqt5sql5 libqt5websockets5 libqt5widgets5 lsof

#Deconz x86
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ] ; then wget -O - http://phoscon.de/apt/deconz.pub.key | sudo apt-key add -; fi
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ] ; then echo "deb [arch=amd64] http://phoscon.de/apt/deconz buster  main" > /etc/apt/sources.list.d/deconz.list; fi
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ] ; then sudo apt-get update && apt-get install -y deconz; fi

#Deconz arm
RUN if [ "$TARGETPLATFORM" = "linux/arm/v7" ] ; then wget -O /wiringpi.deb https://project-downloads.drogon.net/wiringpi-latest.deb; fi
RUN if [ "$TARGETPLATFORM" = "linux/arm/v7" ] ; then dpkg -i /wiringpi.deb && rm -f /wiringpi.deb; fi
RUN if [ "$TARGETPLATFORM" = "linux/arm/v7" ] ; then wget -O /deconz.deb http://deconz.dresden-elektronik.de/raspbian/stable/deconz-latest.deb; fi
RUN if [ "$TARGETPLATFORM" = "linux/arm/v7" ] ; then dpkg -i /deconz.deb && rm -f /deconz.deb && mkdir /root/otau && chown root:root /usr/bin/deCONZ*; fi

# Clean
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install sources
RUN git clone https://github.com/WoodySlum/Smarties-io.git /var/smarties
RUN rm -Rf /root/.ngrok && mkdir -p /var/log/smarties && cd /var/smarties && npm install

# Install start
#cd /var/smarties && npm run start-docker
RUN echo '#!/bin/bash\nwhile true\ndo\n\tcd /var/smarties\n\tnpm run start-docker >> /var/log/smarties/smarties.log\n\tsleep 1\ndone' > /bin/smarties && chmod +x /bin/smarties
