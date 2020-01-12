FROM node:12.14-buster

RUN apt-get update
RUN apt-get install -y --allow-unauthenticated sqlite3 libmagic-dev libatlas-base-dev libudev-dev apt-utils net-tools imagemagick graphicsmagick ffmpeg git sudo
RUN apt-get install -y --allow-unauthenticated python-pip python3-pip alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox mplayer festival festvox-kallpc16k at lsb-release avrdude socat gammu gammu-smsd && apt-get clean

# Deconz
RUN apt-get install -y curl kmod libcap2-bin libqt5core5a libqt5gui5 libqt5network5 libqt5serialport5 libqt5sql5 libqt5websockets5 libqt5widgets5 lsof
ADD https://project-downloads.drogon.net/wiringpi-latest.deb /wiringpi.deb
RUN dpkg -i /wiringpi.deb && rm -f /wiringpi.deb
ADD http://deconz.dresden-elektronik.de/raspbian/stable/deconz-latest.deb /deconz.deb
RUN dpkg -i /deconz.deb && \
    rm -f /deconz.deb && \
    mkdir /root/otau && \
    chown root:root /usr/bin/deCONZ*

# Platformio
RUN pip install -U platformio

# Clean
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install sources
RUN git clone https://github.com/WoodySlum/Hautomation-io.git /var/hautomation
RUN mkdir -p /var/log/hautomation && cd /var/hautomation && npm install >> /var/log/hautomation/npm.log

# Install start
#cd /var/hautomation && npm run start-docker
RUN echo '#!/bin/bash\nwhile true\ndo\n\tcd /var/hautomation\n\tnpm run start-docker >> /var/log/hautomation/hautomation.log\n\tsleep 1\ndone' > /bin/hautomation && chmod +x /bin/hautomation
