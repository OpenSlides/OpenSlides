FROM haproxy:2.0-alpine
COPY src/haproxy.common.cfg /usr/local/etc/haproxy/haproxy.common.cfg
COPY src/haproxy.prod.cfg /usr/local/etc/haproxy/haproxy.prod.cfg
COPY src/combined.pem /usr/local/etc/haproxy/combined.pem
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.common.cfg", "-f", "/usr/local/etc/haproxy/haproxy.prod.cfg"]