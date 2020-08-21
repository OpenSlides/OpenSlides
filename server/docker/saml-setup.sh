# SAML setup
if [[ "$ENABLE_SAML" = True ]]; then
  echo "Setting up SAML"
  for i in /run/secrets/saml_{cert,key,config}; do
    [[ -f "$i" ]] || { echo "ERROR: $i not found!"; exit 3; }
  done
  ln -s /run/secrets/saml_cert   /app/personal_data/var/certs/sp.crt
  ln -s /run/secrets/saml_key    /app/personal_data/var/certs/sp.key
  ln -s /run/secrets/saml_config /app/personal_data/var/saml_settings.json
fi
