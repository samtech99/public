provider "google" {
  credentials = file("/Users/user01/coursework.json")
  project     = "coursework-404912"
  region      = "europe-west2"
}

resource "google_compute_instance" "default" {
  name         = "coursework-vm"
  machine_type = "e2-small"
  zone         = "europe-west2-c"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "root:${file("~/.ssh/id_rsa.pub")}"
  }

metadata_startup_script = <<-EOS
#!/bin/bash

  sudo apt-get update
  sudo apt-get install -y git gnupg curl

  # Install Node.js (Legacy Version)
  curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs

  curl -fsSL https://pgp.mongodb.com/server-7.0.asc |sudo gpg  --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update
  apt-get install -y mongodb-org
  systemctl start mongod
  sudo sed -i 's/bindIp: 127.0.0.1/bindIp: ::,0.0.0.0/' /etc/mongod.conf
  systemctl restart mongod
  # Clone your application from GitHub
  git clone ${var.GITHUB_SECRET_STRING}
  cd Markus_Fischer_Coursework
  rm -rf node_modules
  # Install application dependencies
  npm install
  npm rebuild bcrypt --build-from-source
  npm install express mongoose body-parser 
  npm install jsonwebtoken bcryptjs express-validator 
  npm install axios 
  npm install bcrypt 
  npm install uuid

  # Set environment variables
  export JWT_SECRET="69c053b604af3e0bebc0d0ca18394a373e8f17"
  export MONGODB_STRING="mongodb://localhost:27017/piazza"
  export BASE_URL="http://localhost:8080/api"
  export PORT="8080"

# Create a systemd service file for the Node.js application
cat <<EOF | sudo tee /etc/systemd/system/piazza.service
[Unit]
Description=Node.js Piazza Application

[Service]
ExecStart=/usr/bin/node /Markus_Fischer_Coursework/piazza.js
WorkingDirectory=/Markus_Fischer_Coursework/
Restart=always
User=nobody
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=dev
Environment=JWT_SECRET=69c053b604af3e0bebc0d0ca18394a373e8f17
Environment=MONGODB_STRING=mongodb://127.0.0.1:27017/piazza
Environment=BASE_URL=http://127.0.0.1:8080/api
Environment=PORT=8080
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=piazza


[Install]
WantedBy=multi-user.target
EOF

# Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable piazza
sudo systemctl start piazza

EOS


  service_account {
    scopes = ["cloud-platform"]
  }

  tags = ["http-server"]
}

resource "google_compute_firewall" "default" {
  name    = "http-server"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8080", "8080"]
  }

  allow {
    protocol = "tcp"
    ports    = ["22", "22"]
  }

  allow {
    protocol = "tcp"
    ports    = ["27017", "27017"]
  }


  source_ranges = ["0.0.0.0/0"]
}
