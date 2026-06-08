# Electroplating Cluster Deployment Notes

## Current Goal

Simple single-instance Kubernetes deployment: backend + frontend, no Redis, no rate limiting.

## Architecture

- **Namespace**: `electroplating`
- **Backend**: 1 pod, FastAPI on port 8116, PVC for STL sessions
- **Frontend**: 1 pod, nginx serving React app at `/plateforge`
- **Ingress**: nginx ingress controller
  - `/plateforge` -> frontend
  - `/stl/api` and `/api` -> backend (path rewrite)
  - `/health` -> backend

## Deploy

```bash
./scripts/deploy-k8s.sh deploy
```

## Prerequisites

1. kubectl configured for target cluster
2. nginx ingress controller installed
3. TLS secret `electroplating-tls` in namespace (production overlay)
4. Storage class available for 10Gi PVC

## Changes

- Removed Redis from k8s manifests
- Removed rate limiting decorator from upload endpoint
- Single replica for backend and frontend

## Deployed 2026-06-08 (k3s cluster)

- kubeconfig: `~/.kube/config` (copied from `/etc/rancher/k3s/k3s.yaml`)
- Namespace: `plateforge` (LoadBalancer services on :8116 and :3017)
- Built locally, imported to k3s containerd, pinned to `node-4`
- Redis removed from plateforge namespace
- `./scripts/deploy-k8s.sh deploy` for rebuild + rollout
- Verified: https://mlapi.us/plateforge/ and /stl/api/health return 200
