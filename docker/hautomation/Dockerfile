FROM node:10.14.1-jessie

RUN apt-get update
RUN apt-get install -y --allow-unauthenticated sqlite3 libmagic-dev libatlas-base-dev libudev-dev apt-utils net-tools imagemagick graphicsmagick libav-tools git sudo
RUN apt-get install -y --allow-unauthenticated python-pip python3-pip alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox mplayer festival festvox-kallpc16k at lsb avrdude socat gammu gammu-smsd
# Platformio
RUN pip install -U platformio
# Deconz
RUN usermod -a -G dialout root
RUN wget -O - http://phoscon.de/apt/deconz.pub.key | sudo apt-key add -
RUN sh -c "echo 'deb http://phoscon.de/apt/deconz $(lsb_release -cs) main' > /etc/apt/sources.list.d/deconz.list"
RUN apt-get update
#RUN apt-get install -y --allow-unauthenticated deconz
# Install sources
RUN git clone https://github.com/WoodySlum/Hautomation-io.git /var/hautomation
# Install start
#cd /var/hautomation && npm run start-docker
RUN echo '#!/bin/bash\nwhile true\ndo\n\tmkdir -p /var/log/hautomation\n\tcd /var/hautomation\n\tnpm install >> /var/log/hautomation/npm.log\n\tnpm run start-docker >> /var/log/hautomation/hautomation.log\n\tsleep 1\ndone' > /bin/hautomation && chmod +x /bin/hautomation
