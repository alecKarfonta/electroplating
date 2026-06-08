# PlateForge Kubernetes manifests

Managed via [~/git/system](~/git/system) conventions.

## Layout

```
k8s/
├── base/                 # Namespace, config, deployment, service, ingress
└── overlays/
    ├── homelab/          # k3s: local image, hostPort, no ingress
    └── production/       # GHCR image, ingress TLS, PVC
```

## Deploy

Homelab (build + import + apply):

```bash
./scripts/deploy-k8s.sh deploy
# equivalent:
~/git/system/scripts/deploy-app.sh plateforge
```

Production:

```bash
K8S_OVERLAY=production IMAGE_TAG=latest ./scripts/deploy-k8s.sh deploy
```

Preview changes:

```bash
./scripts/deploy-k8s.sh diff
```

## Nginx

Edge routing config is canonical in `~/git/system/nginx/apps/plateforge.conf`.

```bash
sudo ~/git/system/scripts/install-nginx-app.sh plateforge
```
