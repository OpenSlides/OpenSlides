./prepare-cert.sh
docker build --tag "${img:-openslides/openslides-haproxy:latest}" \
    --pull "${OPTIONS[@]}" .