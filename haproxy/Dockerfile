FROM haproxy:2.0-alpine
COPY src/haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
COPY src/haproxy.prod.cfg /usr/local/etc/haproxy/haproxy.prod.cfg
COPY src/combined.pem /usr/local/etc/haproxy/combined.pem
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg", "-f", "/usr/local/etc/haproxy/haproxy.prod.cfg"]
