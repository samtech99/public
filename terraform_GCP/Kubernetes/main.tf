provider "google" {
  credentials = file("/Users/user01/coursework.json")
  project     = "coursework-404912"
  region      = "europe-west2"
}

resource "google_container_cluster" "primary" {
  name     = "coursework-cluster"
  location = "europe-west2-a"

  remove_default_node_pool = true
  initial_node_count = 1

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }
}


resource "google_container_node_pool" "primary_nodes" {
  name       = "coursework-node-pool"
  location   = "europe-west2-a"
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = false
    machine_type = "e2-medium"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
