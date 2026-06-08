# Kubernetes manifests

Deploy via [~/git/system](~/git/system). The repo contract is in [`system.yaml`](../system.yaml) at the repo root.

## Required layout

```
system.yaml                 # deploy contract (read by system)
k8s/
├── base/
└── overlays/
    ├── homelab/            # local image, cheap-CPU affinity, no ingress
    └── production/         # GHCR image, ingress TLS
```

## Commands

```bash
# From this repo
./scripts/deploy-k8s.sh deploy
./scripts/deploy-k8s.sh diff

# From system (preferred)
~/git/system/scripts/validate-app.sh plateforge
~/git/system/scripts/deploy-app.sh plateforge deploy
~/git/system/scripts/deploy-app.sh plateforge verify
```

Production:

```bash
K8S_OVERLAY=production IMAGE_TAG=latest ./scripts/deploy-k8s.sh deploy
```

## Nginx

```bash
sudo ~/git/system/scripts/install-nginx-app.sh plateforge
```
