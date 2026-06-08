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
