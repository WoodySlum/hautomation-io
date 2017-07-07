[Unit]
Description=Hautomation

[Service]
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}hautomation 2>&1 >> /var/log/hautomation-js.log'
Restart=always
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
