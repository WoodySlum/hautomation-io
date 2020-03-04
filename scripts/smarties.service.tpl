[Unit]
Description=Smarties

[Service]
CPUWeight=20
CPUQuota=85%
IOWeight=20
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:Var/smarties
Environment=NODE_ENV=production
Environment=LD_LIBRARY_PATH=/var/smarties/res/ai/opencv/lib
ExecStart=/bin/sh -c '{INSTALLATION_FOLDER}smarties 2>&1 >> /var/log/smarties.log'
Restart=always
WorkingDirectory={INSTALLATION_FOLDER}

[Install]
WantedBy=multi-user.target
