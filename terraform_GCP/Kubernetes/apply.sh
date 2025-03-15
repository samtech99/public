#!/bin/sh

export USE_GKE_GCLOUD_AUTH_PLUGIN=True
source /Users/user01/.bash_profile

#gcloud auth login

terraform init
terraform plan 

terraform apply 

gcloud components install gke-gcloud-auth-plugin

gcloud container clusters get-credentials coursework-cluster --zone europe-west2-a --project coursework-404912

kubectl apply -f namespace.yaml
kubectl apply -f kubernetes.yaml

kubectl -n coursework-ns get all