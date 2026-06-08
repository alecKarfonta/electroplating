#!/bin/bash
# Point mlapi.us plateforge nginx upstreams at local electroplating services.
# Requires sudo to edit /etc/nginx and reload.

set -euo pipefail

UPSTREAMS_FILE="/etc/nginx/conf.d/00-upstreams.conf"
API_HOST="${PLATEFORGE_API_HOST:-127.0.0.1}"
API_PORT="${PLATEFORGE_API_PORT:-8116}"
FE_HOST="${PLATEFORGE_FE_HOST:-127.0.0.1}"
FE_PORT="${PLATEFORGE_FE_PORT:-3017}"

if [ "$(id -u)" -ne 0 ]; then
    echo "Run with sudo: sudo $0"
    exit 1
fi

cp "${UPSTREAMS_FILE}" "${UPSTREAMS_FILE}.bak.$(date +%Y%m%d%H%M%S)"

python3 - "${UPSTREAMS_FILE}" "${API_HOST}" "${API_PORT}" "${FE_HOST}" "${FE_PORT}" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
api_host, api_port, fe_host, fe_port = sys.argv[2:6]
text = path.read_text()

text = re.sub(
    r"(upstream host196_plateforge_api \{\n\s*server )[^;]+;",
    rf"\g<1>{api_host}:{api_port};",
    text,
)
text = re.sub(
    r"(upstream host196_plateforge_fe \{\n\s*server )[^;]+;",
    rf"\g<1>{fe_host}:{fe_port};",
    text,
)
path.write_text(text)
PY

nginx -t
systemctl reload nginx
echo "Plateforge upstreams now point to ${API_HOST}:${API_PORT} and ${FE_HOST}:${FE_PORT}"
