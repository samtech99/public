#!/bin/sh

username=$(jq -r '.auths."docker.io".username' /etc/docker/auth.json)
password=$(jq -r '.auths."docker.io".password' /etc/docker/auth.json)

buildah login -u $username -p $password  docker.io


# Infinite loop
while true; do
  # Read the node IP from the Kubernetes downward API (mounted as an env variable or file)
  NODE_IP=${NODE_IP}


  # Read the Kubernetes token from a secret (mounted as a file)
  TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)


  # Example checkpoint command
  curl -k -H "Authorization: Bearer $TOKEN" -X POST "https://${NODE_IP}:10250/checkpoint/${NAMESPACE}/${POD_NAME}/${CONTAINER_NAME}"

############## Build and push container ###############

cd /nfs

# Define variables
REGISTRY="${DOCKER_REGISTRY}" # Use "docker.io" for Docker Hub or your specific registry URL
REGISTRY_USERNAME="markusfischer1"
IMAGE_NAME="cp-${CONTAINER_NAME}"
CHECKPOINT_TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S) #


tar_file=$(ls *.tar | head -n 1)
FULL_IMAGE_NAME="${REGISTRY}/${REGISTRY_USERNAME}/${IMAGE_NAME}:${CHECKPOINT_TIMESTAMP}"

echo "FROM scratch" > Dockerfile
echo "ADD ${tar_file} ." >> Dockerfile


buildah bud \
  --annotation=io.kubernetes.cri-o.annotations.checkpoint.name=counter \
  -t $FULL_IMAGE_NAME \
  Dockerfile 


buildah push "$FULL_IMAGE_NAME"

rm -rf *.tar
rm -rf Dockerfile
  
  sleep ${SLEEP_TIME}
done


