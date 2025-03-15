#!/bin/sh


terraform init
terraform plan -var-file="/Users/user01/terraform_secure_token.tfvars"

terraform apply -var-file="/Users/user01/terraform_secure_token.tfvars"