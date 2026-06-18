## mlapi.us/plateforge 502 (2026-06-17)

**Symptom:** https://mlapi.us/plateforge/ returns 502 Bad Gateway.

**Root cause:** nginx upstream `host196_plateforge_api` pointed at `127.0.0.1:8116`, which refuses connections on node-4. The plateforge app is reachable on `localhost:8116` (IPv6 `::1`) and `192.168.1.4:8116` — k3s servicelb binds the LoadBalancer on LAN IPs while a local docker `plateforge` container serves the app on `[::]:8116`.

**stockastic.us is unaffected** — separate `server_name`, SSL cert, and `stocker_api` upstream on `127.0.0.1:8734`.

**Fix (on node-4):**
```bash
sudo ~/git/system/scripts/install-nginx-app.sh plateforge
```

Upstream in `~/git/system/nginx/upstreams/plateforge.conf` must use `[::1]:8116` (nginx resolves `localhost` to `127.0.0.1`).

**Secondary issue:** k8s pod `plateforge/backend` is `ImagePullBackOff` (`electroplating-app:local` not on node `xeon`). Traffic is served by an 8-day-old docker container, not the cluster deployment. Redeploy with `make app-deploy APP=plateforge` after image import.

## App deploy contract (2026-06-08)

Plateforge is managed by `~/git/system` via the app deploy contract.

```bash
# From system repo
make app-validate APP=plateforge
make app-deploy APP=plateforge

# From electroplate repo
./scripts/deploy-k8s.sh deploy
./scripts/deploy-k8s.sh diff
```

### Storage

Default: `emptyDir` sessions (ephemeral). For Longhorn-backed persistence:

```bash
SESSIONS_STORAGE=pvc make app-deploy APP=plateforge
```

Set permanently in `system.yaml` under `storage.sessions.type`.

### Local dev

Unified app (matches cluster):

```bash
docker compose up app
```

Split frontend/backend (legacy dev):

```bash
docker compose --profile split up
```

## Architecture

- **Namespace**: `plateforge`
- **Deployment**: single unified container (`electroplating-app:local`) on port 8116
- **Service**: LoadBalancer :8116 (API) and :3017 (UI alias)
- **Scheduling**: `homelab/cpu-tier=cheap` in homelab overlay
- **Edge**: mlapi.us nginx → LoadBalancer (no in-cluster ingress on homelab)

## Deployed via system contract

- `system.yaml` + `k8s/overlays/homelab` (+ `homelab-pvc` when storage=pvc)
- Verified: https://mlapi.us/plateforge/ and /stl/api/health
