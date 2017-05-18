#!/bin/bash
INSTALLATION_FOLDER="/var/hautomation/"
sudo systemctl stop hautomation
sudo cp -f ./hautomation.service /etc/systemd/system
sudo systemctl daemon-reload
sudo cp -Rf ../* $INSTALLATION_FOLDER
sudo systemctl enable hautomation
sudo systemctl start hautomation
sudo rm -Rf $INSTALLATION_FOLDER/scripts
