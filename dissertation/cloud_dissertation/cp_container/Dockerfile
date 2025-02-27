FROM alpine:latest
RUN apk update && apk upgrade 
RUN apk add --no-cache curl jq buildah shadow fuse-overlayfs
RUN adduser -D -G `getent group 999 | cut -d: -f1` app

RUN echo "app:100000:65536" | tee -a /etc/subuid && echo "app:100000:65536" | tee -a /etc/subgid
RUN usermod --add-subuids 100000-165535 --add-subgids 100000-165535 app

COPY sidecar-script.sh /app/sidecar-script.sh
COPY registries.conf /etc/containers/registries.conf
COPY containers.conf /etc/containers/containers.conf
COPY storage.conf /etc/containers/storage.conf

RUN mkdir -p /app/storage && mkdir -p /app/runroot 
RUN chmod +x /app/sidecar-script.sh && chmod -R a+rwx /app && chown -R app app

USER app
#USER root
WORKDIR /app
CMD ["/app/sidecar-script.sh"]

