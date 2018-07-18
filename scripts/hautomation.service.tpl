[Unit]
Description=Hautomation

[Service]
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:Var/hautomation
Environment=NODE_ENV=production
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}hautomation 2>&1 >> /var/log/hautomation.log'
Restart=always
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
