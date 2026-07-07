FROM alpine:3 as dev
RUN apk add --no-cache curl jq
COPY setup.sh /setup.sh
RUN chmod +x /setup.sh
ENTRYPOINT ["/setup.sh"]

