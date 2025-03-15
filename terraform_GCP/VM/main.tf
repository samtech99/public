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
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    # Create a Docker volume for MongoDB data
    sudo docker volume create mongodbdata

    sudo docker network create app-network
    sudo docker run -d --name mongodb -p 27017:27017 -v mongodbdata:/data/db --network app-network mongo

    sudo docker run -d -p 8080:3000 \
        -e JWT_SECRET="69c053b604af3e0bebc0d0ca18394a373e8f17" \
        -e MONGODB_STRING="mongodb://mongodb:27017/piazza" \
        -e BASE_URL="http://localhost:3000/api" \
        --network app-network \
        --name nodejs \
        markusfischer1/markus1fischer1cloud1computing1coursework:0.0.3
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
