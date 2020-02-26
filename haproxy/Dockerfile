FROM haproxy:2.0.8-alpine
COPY src/haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
COPY src/prod-haproxy.cfg /usr/local/etc/haproxy/prod-haproxy.cfg
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg", "-f", "/usr/local/etc/haproxy/prod-haproxy.cfg"]
