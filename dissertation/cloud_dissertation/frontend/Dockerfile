FROM node:20.12.0-bookworm

# Use root for installations
USER root

# Install dependencies required for adding new repository
RUN apt-get update && apt dist-upgrade -y && \
    apt-get install -y wget curl gnupg2 lsb-release software-properties-common mc vim net-tools criu cri-o cri-o-runc

# Add the Podman repository
RUN . /etc/os-release && \
    echo "deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/Debian_$VERSION_ID/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list && \
    wget -nv https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable/Debian_$VERSION_ID/Release.key -O Release.key && \
    apt-key add - < Release.key && \
    apt-get update -qq

# Install Podman
RUN apt-get -qq -y install podman buildah bash

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY --chown=node:node nodejs-k8s-app/package*.json ./
RUN npm install


# Copy app source
COPY --chown=node:node nodejs-k8s-app/server.mjs ./
COPY --chown=node:node nodejs-k8s-app/get.mjs ./
COPY --chown=node:node nodejs-k8s-app/post.mjs ./
COPY --chown=node:node nodejs-k8s-app/common.mjs ./
RUN mkdir -p views
COPY --chown=node:node views/pods.ejs ./views/

EXPOSE 8080

# Switch to 'node' user
USER node

CMD ["node", "server.mjs"]

