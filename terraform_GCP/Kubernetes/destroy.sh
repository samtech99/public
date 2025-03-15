#!/bin/sh


kubectl delete -f kubernetes.yaml
kubectl delete -f namespace.yaml

terraform init

terraform destroy