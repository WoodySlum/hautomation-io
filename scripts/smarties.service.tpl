[Unit]
Description=Smarties

[Service]
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:Var/smarties
Environment=NODE_ENV=production
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}smarties 2>&1 >> /var/log/smarties.log'
Restart=always
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
