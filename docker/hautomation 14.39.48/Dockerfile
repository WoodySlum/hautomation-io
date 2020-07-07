FROM node:10.14.1-jessie

RUN apt-get update
RUN apt-get install -y --allow-unauthenticated sudo sqlite3 libmagic-dev libatlas-base-dev libudev-dev apt-utils net-tools imagemagick graphicsmagick libav-tools git python-pip python3-pip alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox mplayer festival festvox-kallpc16k at
RUN pip install -U platformio
RUN git clone https://github.com/WoodySlum/Hautomation-io.git /var/hautomation
