[Unit]
Description=Smarties

[Service]
Restart=always
RestartSec=90
StartLimitInterval=400
StartLimitBurst=10
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:Var/smarties
Environment=NODE_ENV=production
Environment=LD_LIBRARY_PATH=/var/smarties/res/ai/opencv/lib
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}smarties 2>&1 >> /var/log/smarties.log'
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
