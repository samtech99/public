#!/bin/sh

terraform init

terraform destroy -var-file="/Users/user01/terraform_secure_token.tfvars"