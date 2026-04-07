#!/usr/bin/env bash
# Process custom domain provisioning tasks.
# Called by systemd watcher when new .json files appear in TASKS_DIR.
set -euo pipefail

TASKS_DIR="/var/www/domain-tasks"
TEMPLATE="/root/projects/codebg/infra/nginx/custom-domain.conf.template"
NGINX_DIR="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CERTBOT_EMAIL="hello@codebg.com"

process_task() {
  local file="$1"
  local action domain subdomain result_file

  action=$(jq -r '.action' "$file")
  domain=$(jq -r '.domain' "$file")
  subdomain=$(jq -r '.subdomain' "$file")
  result_file="${TASKS_DIR}/${domain}.result.json"

  echo "[domain] Processing: action=$action domain=$domain subdomain=$subdomain"

  case "$action" in
    setup)
      setup_domain "$domain" "$subdomain" "$result_file"
      ;;
    remove)
      remove_domain "$domain" "$result_file"
      ;;
    *)
      echo "[domain] Unknown action: $action"
      echo '{"success":false,"error":"unknown action"}' > "$result_file"
      ;;
  esac

  # Clean up task file after processing
  rm -f "$file"
}

setup_domain() {
  local domain="$1" subdomain="$2" result_file="$3"
  local conf_file="${NGINX_DIR}/custom-${domain}"

  # Step 1: HTTP-only config for certbot challenge
  cat > "$conf_file" <<HTTPCONF
server {
    listen 80;
    server_name ${domain} www.${domain};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 444; }
}
HTTPCONF

  ln -sf "$conf_file" "${NGINX_ENABLED}/custom-${domain}"

  if ! nginx -t 2>/dev/null; then
    echo '{"success":false,"error":"nginx config test failed (HTTP stage)"}' > "$result_file"
    rm -f "$conf_file" "${NGINX_ENABLED}/custom-${domain}"
    return 1
  fi
  systemctl reload nginx

  # Step 2: Provision SSL certificate
  if ! certbot certonly --webroot -w /var/www/certbot \
    -d "$domain" -d "www.${domain}" \
    --non-interactive --agree-tos -m "$CERTBOT_EMAIL" 2>/tmp/certbot-${domain}.log; then
    local certerr
    certerr=$(tail -3 /tmp/certbot-${domain}.log | tr '\n' ' ')
    echo "{\"success\":false,\"error\":\"SSL cert failed: ${certerr}\"}" > "$result_file"
    rm -f "$conf_file" "${NGINX_ENABLED}/custom-${domain}"
    systemctl reload nginx
    return 1
  fi

  # Step 3: Full SSL config from template
  sed -e "s/{{DOMAIN}}/${domain}/g" -e "s/{{SUBDOMAIN}}/${subdomain}/g" "$TEMPLATE" > "$conf_file"

  if ! nginx -t 2>/dev/null; then
    echo '{"success":false,"error":"nginx config test failed (SSL stage)"}' > "$result_file"
    rm -f "$conf_file" "${NGINX_ENABLED}/custom-${domain}"
    systemctl reload nginx
    return 1
  fi
  systemctl reload nginx

  echo "[domain] ✓ ${domain} is live → /var/www/sites/${subdomain}-custom/"
  echo '{"success":true}' > "$result_file"
}

remove_domain() {
  local domain="$1" result_file="$2"

  rm -f "${NGINX_DIR}/custom-${domain}" "${NGINX_ENABLED}/custom-${domain}"
  nginx -t 2>/dev/null && systemctl reload nginx

  echo "[domain] ✓ ${domain} removed"
  echo '{"success":true}' > "$result_file"
}

# Process all pending task files
for file in "${TASKS_DIR}"/*.json; do
  [ -f "$file" ] || continue
  # Skip result files
  [[ "$file" == *.result.json ]] && continue
  process_task "$file"
done
