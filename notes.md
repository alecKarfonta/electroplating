# Electroplating Cluster Deployment Notes

## Current Goal

Simple single-instance Kubernetes deployment: backend + frontend, no Redis, no rate limiting.

## Architecture

- **Namespace**: `plateforge`
- **Single pod**: unified app on port 8116 (API + UI at `/plateforge`)
- **Service**: LoadBalancer ports 8116 (API) and 3017 (UI)
- **Node**: pinned to `node-4`, image imported locally (`IfNotPresent`)
- **External**: mlapi.us reverse proxy → `/plateforge` and `/stl/api`

## Deploy

Homelab (via ~/git/system):

```bash
./scripts/deploy-k8s.sh deploy
# or: ~/git/system/scripts/deploy-app.sh plateforge
```

Nginx (on mlapi.us host):

```bash
sudo ~/git/system/scripts/install-nginx-app.sh plateforge
```

## Standardized deployment (2026-06-08)

- **System repo**: `~/git/system` — app registry, nginx configs, shared deploy scripts
- **Kustomize overlays**: `k8s/overlays/homelab` (k3s local) and `k8s/overlays/production` (GHCR + ingress)
- **Namespace/config**: unified to `plateforge` / `plateforge-config` in manifests
- **Deploy**: declarative `kubectl apply -k` via `~/git/system/scripts/deploy-app.sh plateforge`
- **Nginx canonical**: `~/git/system/nginx/apps/plateforge.conf`

## Changes

- Removed Redis from k8s manifests
- Removed rate limiting decorator from upload endpoint
- Single replica for backend and frontend

## Lightweight deployment (2026-06-08)

- Single unified Docker image: React static UI + FastAPI backend
- `requirements-prod.txt`: numpy, numpy-stl, FastAPI only (no scipy/redis/auth bloat)
- Multi-stage Dockerfile: Node build → Python wheels → slim runtime
- UI served at `/plateforge`, API at `/upload`, `/sessions/...`, `/health`
- Local: `docker compose up --build` → http://localhost:8116/plateforge
- Prod ingress: `/plateforge` and `/stl/api` both route to backend pod
- K8s: one backend deployment (frontend pod removed), 256Mi request / 512Mi limit

## UI Refinement (2026-06-08)

- Simplified frontend to minimal professional layout: flat theme, no gradients/decorative icons
- Removed redundant surface area hero, detailed mesh stats (triangle areas, edge lengths), process recommendation cards
- Consolidated electroplating results to key metrics; mesh analysis and resin cost collapsed in accordions

## mlapi.us /plateforge not loading (2026-06-08)

**Root cause:** nginx `proxy_pass http://host196_plateforge_fe/;` had a trailing slash, which strips the `/plateforge/` prefix. The backend received `GET /` and returned API JSON instead of the React app.

**Also:** k8s had rolled back to `192.168.1.78:30500/plateforge/backend:latest` (API-only image, no `/app/static`).

**Fix (applied):** App now serves UI at `/` and assets at `/static/` so nginx path-stripping works without config changes. Optional nginx fix still available: `sudo ./scripts/fix-mlapi-plateforge-nginx.sh`

## Deployed 2026-06-08 — cheap CPU tier (dev node)

- `homelab/cpu-tier=cheap` required affinity → pod on `dev` (192.168.1.154)
- Image must exist on worker nodes; `import-k3s-image.sh` imports to server + cheap nodes
- Verified: `/health`, LoadBalancer :8116, `https://mlapi.us/plateforge/`, `/stl/api/health`

- Single pod: `backend` on `node-4`, image `electroplating-app:local` (~283MB)
- Frontend deployment removed; UI served from backend at `/plateforge`
- Service ports: 8116 (API), 3017 (UI) → same pod
- `./scripts/deploy-k8s.sh deploy` — build, import to k3s, patch IfNotPresent, rollout
- Verified: https://mlapi.us/plateforge/ and /stl/api/health return 200

## Deployed 2026-06-08 (k3s cluster)

- kubeconfig: `~/.kube/config` (copied from `/etc/rancher/k3s/k3s.yaml`)
- Namespace: `plateforge` (LoadBalancer services on :8116 and :3017)
- Built locally, imported to k3s containerd, pinned to `node-4`
- Redis removed from plateforge namespace
- `./scripts/deploy-k8s.sh deploy` for rebuild + rollout
- Verified: https://mlapi.us/plateforge/ and /stl/api/health return 200
