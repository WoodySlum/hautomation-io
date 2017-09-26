[Unit]
Description=Hautomation

[Service]
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}hautomation 2>&1 >> /var/log/hautomation-js.log'
Restart=always
Environment=NODE_ENV=production
WorkingDirectory={INSTALLATION_FOLDER}
User=root
Group=nogroup

[Install]
WantedBy=multi-user.target
