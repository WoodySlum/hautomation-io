[Unit]
Description=Hautomation

[Service]
ExecStart={INSTALLATION_FOLDER}hautomation
Restart=always
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
