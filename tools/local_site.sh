#!/usr/bin/env bash
# Local release of the assessment site: build a snapshot, serve it with nginx, put it on the tailnet.
#
#   tools/local_site.sh build    snapshot the working tree into a new release and switch to it (atomic)
#   tools/local_site.sh up       API + nginx + tailnet (builds first if there is no release yet)
#   tools/local_site.sh down     tailnet off, nginx stopped, API stopped
#   tools/local_site.sh status
#
# Release:  ~/.local/share/prduct-site/releases/<stamp>, `current` -> the live one (last 5 kept, hard-linked)
# nginx:    docker container prduct-nginx (nginx:alpine, host network) on 127.0.0.1:8090; tools/local/ is its conf.d
#           (edit tools/local/nginx.conf, then: docker exec prduct-nginx nginx -s reload)
# API:      systemd user unit prduct-site.service (assessment/server.py on 127.0.0.1:8787; /api/* only via nginx)
# Tailnet:  https://nezopt.tail75dcfc.ts.net:8443 (tailscale serve, tailnet only — never the funneled :443)
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR="${PRDUCT_SITE_HOME:-$HOME/.local/share/prduct-site}"
CONF="$SITE/tools/local/nginx.conf"
NAME=prduct-nginx
PORT=8090
TAILNET_PORT=8443
KEEP=5

build() {
  mkdir -p "$HOME_DIR/releases"
  local stamp prev dest
  stamp="$(date +%Y%m%d-%H%M%S)"
  dest="$HOME_DIR/releases/$stamp"
  prev=""; [ -e "$HOME_DIR/current" ] && prev="$(readlink -f "$HOME_DIR/current")"
  rsync -a --delete ${prev:+--link-dest="$prev"} \
    --include='docs/' --include='docs/journey/***' --exclude='docs/*' \
    --exclude='.git/' --exclude='.vercel/' --exclude='_handoff/' --exclude='node_modules/' --exclude='__pycache__/' \
    --exclude='pathfinder/tests/' --exclude='tools/' --exclude='api/' --exclude='submissions.jsonl' \
    --exclude='*.hidden' --exclude='package*.json' --exclude='server.py' --exclude='vercel.json' --exclude='.gitignore' \
    "$SITE/" "$dest/"
  ln -sfn "releases/$stamp" "$HOME_DIR/current.tmp" && mv -T "$HOME_DIR/current.tmp" "$HOME_DIR/current"
  ls -1d "$HOME_DIR"/releases/*/ | sort | head -n -"$KEEP" | xargs -r rm -rf
  echo "built release $stamp ($(du -sh --apparent-size "$dest" | cut -f1), $(find "$dest" -type f | wc -l) files); current -> releases/$stamp"
}

up() {
  [ -e "$HOME_DIR/current" ] || build
  systemctl --user enable --now prduct-site.service >/dev/null 2>&1
  if docker inspect "$NAME" >/dev/null 2>&1; then
    docker start "$NAME" >/dev/null
  else
    docker run -d --name "$NAME" --restart unless-stopped --network host \
      -v "$HOME_DIR:/srv/prduct:ro" -v "$(dirname "$CONF"):/etc/nginx/conf.d:ro" nginx:alpine >/dev/null
  fi
  docker exec "$NAME" nginx -t -q && docker exec "$NAME" nginx -s reload
  tailscale serve --bg --https="$TAILNET_PORT" "http://127.0.0.1:$PORT" >/dev/null
  status
}

down() {
  tailscale serve --https="$TAILNET_PORT" off >/dev/null 2>&1 || true
  docker stop "$NAME" >/dev/null 2>&1 || true
  systemctl --user disable --now prduct-site.service >/dev/null 2>&1 || true
  status
}

status() {
  echo "release : $(readlink "$HOME_DIR/current" 2>/dev/null || echo none)"
  echo "nginx   : $(docker inspect -f '{{.State.Status}}' "$NAME" 2>/dev/null || echo absent) (127.0.0.1:$PORT)"
  echo "api     : $(systemctl --user is-active prduct-site.service 2>/dev/null) (127.0.0.1:8787)"
  if tailscale serve status 2>/dev/null | grep -q ":$TAILNET_PORT"; then
    echo "tailnet : https://$(tailscale status --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))'):$TAILNET_PORT (tailnet only)"
  else
    echo "tailnet : off"
  fi
}

case "${1:-status}" in
  build) build ;;
  up) up ;;
  down) down ;;
  status) status ;;
  *) echo "usage: $0 build|up|down|status" >&2; exit 2 ;;
esac
