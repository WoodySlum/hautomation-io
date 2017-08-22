#!/bin/bash

if [ -z "$1" ]
  then
    echo "No user supplied"
    exit
fi

if [ -z "$2" ]
  then
    echo "No group supplied"
    exit
fi

if [ -z "$3" ]
  then
    echo "No installation folder supplied"
    exit
fi

USER=$1
GROUP=$2
INSTALLATION_FOLDER=$3

sed -e "s@{INSTALLATION_FOLDER}@$INSTALLATION_FOLDER@" ./hautomation.service.tpl > ./hautomation.service
sudo systemctl stop hautomation
sudo cp -f ./hautomation.service /etc/systemd/system
sudo systemctl daemon-reload
sudo rm -Rf /tmp/saved-data
sudo mv "$INSTALLATION_FOLDER/data" /tmp/saved-data
sudo cp -Rf ../* $INSTALLATION_FOLDER
sudo cp -Rf /tmp/saved-data/* $INSTALLATION_FOLDER/data/
sudo chown -R $USER:$GROUP $INSTALLATION_FOLDER
sudo chmod -R 0660 $INSTALLATION_FOLDER
sudo chmod +x ${INSTALLATION_FOLDER}hautomation
sudo systemctl enable hautomation
sudo systemctl start hautomation
sudo rm -Rf $INSTALLATION_FOLDER/scripts
