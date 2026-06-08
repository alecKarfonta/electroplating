#!/bin/bash

# Deploy electroplating to a Kubernetes cluster using Kustomize manifests.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OVERLAY="${K8S_OVERLAY:-cluster}"
export KUBECONFIG="${KUBECONFIG:-${HOME}/.kube/config}"
NAMESPACE="${K8S_NAMESPACE:-plateforge}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-alecKarfonta/electroplating}"
REGISTRY="ghcr.io"
BACKEND_IMAGE="${REGISTRY}/$(echo "${GITHUB_REPOSITORY}" | tr '[:upper:]' '[:lower:]')/backend"
FRONTEND_IMAGE="${REGISTRY}/$(echo "${GITHUB_REPOSITORY}" | tr '[:upper:]' '[:lower:]')/frontend"

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    cat <<EOF
Usage: $0 [command]

Commands:
  deploy     Apply manifests and wait for rollout (default)
  diff       Show what would change
  delete     Remove the deployment from the cluster
  status     Show deployment status

Environment variables:
  K8S_OVERLAY          Kustomize overlay name (default: cluster)
  KUBECONFIG           Path to kubeconfig (default: ~/.kube/config)
  IMAGE_TAG            Image tag to deploy (default: latest)
  GITHUB_REPOSITORY    GitHub repo for image path (default: alecKarfonta/electroplating)
  KUBECTL_CONTEXT      kubectl context to use (optional)
  K8S_NAMESPACE        Target namespace (default: plateforge)
EOF
}

deploy_cluster_overlay() {
    check_prerequisites
    build_images

    print_status "Updating namespace '${NAMESPACE}' with locally built images"
    kubectl_cmd -n "${NAMESPACE}" delete deployment,service redis --ignore-not-found
    kubectl_cmd apply -f "${REPO_ROOT}/k8s/overlays/cluster/plateforge-config.yaml"

    kubectl_cmd -n "${NAMESPACE}" set image deployment/backend \
        backend=docker.io/library/electroplating-backend:local
    kubectl_cmd -n "${NAMESPACE}" set image deployment/frontend \
        frontend=docker.io/library/electroplating-frontend:local

    kubectl_cmd -n "${NAMESPACE}" patch deployment backend --type=json -p='[
      {"op":"replace","path":"/spec/template/spec/nodeSelector","value":{"kubernetes.io/hostname":"node-4"}},
      {"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"IfNotPresent"},
      {"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/httpGet/path","value":"/health"},
      {"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/health"},
      {"op":"remove","path":"/spec/template/spec/affinity"}
    ]' 2>/dev/null || true

    kubectl_cmd -n "${NAMESPACE}" patch deployment frontend --type=json -p='[
      {"op":"replace","path":"/spec/template/spec/nodeSelector","value":{"kubernetes.io/hostname":"node-4"}},
      {"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"IfNotPresent"}
    ]'

    print_status "Waiting for deployments to become ready..."
    kubectl_cmd -n "${NAMESPACE}" rollout status deployment/backend --timeout=300s
    kubectl_cmd -n "${NAMESPACE}" rollout status deployment/frontend --timeout=180s

    print_success "Deployment complete"
    kubectl_cmd -n "${NAMESPACE}" get pods,svc
}

check_prerequisites() {
    if ! command -v kubectl >/dev/null 2>&1; then
        print_error "kubectl is not installed."
        exit 1
    fi

    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "Cannot reach the Kubernetes cluster. Check kubeconfig and context."
        exit 1
    fi

    print_success "kubectl can reach the cluster"
}

kubectl_cmd() {
    if [ -n "${KUBECTL_CONTEXT:-}" ]; then
        kubectl --context "${KUBECTL_CONTEXT}" "$@"
    else
        kubectl "$@"
    fi
}

build_images() {
    print_status "Building images with docker compose..."
    docker compose -f "${REPO_ROOT}/docker-compose.yml" build

    if [ "${OVERLAY}" = "cluster" ]; then
        docker tag electroplating-backend:latest electroplating-backend:local
        docker tag electroplating-frontend:latest electroplating-frontend:local
        import_local_images
        return
    fi

    docker tag electroplating-backend:latest "${BACKEND_IMAGE}:${IMAGE_TAG}"
    docker tag electroplating-frontend:latest "${FRONTEND_IMAGE}:${IMAGE_TAG}"
}

import_local_images() {
    local k3s_pid
    k3s_pid="$(pgrep -n -f 'k3s server' || true)"
    if [ -z "${k3s_pid}" ]; then
        print_error "k3s server process not found"
        exit 1
    fi

    print_status "Importing images into k3s containerd (pid ${k3s_pid})..."
    docker save electroplating-backend:local | docker run --rm -i --privileged --pid host alpine \
        nsenter -t "${k3s_pid}" -m -u -i -n -p sh -c \
        'cat > /tmp/backend.tar && /usr/local/bin/k3s ctr images import /tmp/backend.tar && rm /tmp/backend.tar' >/dev/null
    docker save electroplating-frontend:local | docker run --rm -i --privileged --pid host alpine \
        nsenter -t "${k3s_pid}" -m -u -i -n -p sh -c \
        'cat > /tmp/frontend.tar && /usr/local/bin/k3s ctr images import /tmp/frontend.tar && rm /tmp/frontend.tar' >/dev/null
    print_success "Images imported into k3s"
}

kustomize_build() {
    local manifest
    manifest="$(kubectl_cmd kustomize "${REPO_ROOT}/k8s/overlays/${OVERLAY}" \
        --load-restrictor LoadRestrictionsNone)"

    if [ "${OVERLAY}" != "cluster" ]; then
        manifest="$(printf '%s\n' "${manifest}" | sed \
            -e "s|ghcr.io/aleckarfonta/electroplating/backend:latest|${BACKEND_IMAGE}:${IMAGE_TAG}|g" \
            -e "s|ghcr.io/aleckarfonta/electroplating/frontend:latest|${FRONTEND_IMAGE}:${IMAGE_TAG}|g")"
    fi

    printf '%s\n' "${manifest}"
}

deploy() {
    if [ "${OVERLAY}" = "cluster" ]; then
        deploy_cluster_overlay
        return
    fi

    check_prerequisites
    build_images

    print_status "Deploying overlay '${OVERLAY}' to namespace '${NAMESPACE}'"
    print_status "Backend image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
    print_status "Frontend image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"

    kustomize_build | kubectl_cmd apply -f -

    print_status "Waiting for deployments to become ready..."
    kubectl_cmd -n "${NAMESPACE}" rollout status deployment/backend --timeout=300s
    kubectl_cmd -n "${NAMESPACE}" rollout status deployment/frontend --timeout=180s

    print_success "Deployment complete"
    print_status "Services:"
    kubectl_cmd -n "${NAMESPACE}" get ingress,svc,pods
}

show_diff() {
    check_prerequisites
    print_status "Diff for overlay '${OVERLAY}'"
    kustomize_build | kubectl_cmd diff -f - || true
}

delete_deployment() {
    check_prerequisites
    print_warning "Deleting electroplating resources from namespace '${NAMESPACE}'"
    kustomize_build | kubectl_cmd delete -f - --ignore-not-found
    print_success "Resources deleted"
}

show_status() {
    check_prerequisites
    kubectl_cmd -n "${NAMESPACE}" get all,ingress,pvc,configmap
}

COMMAND="${1:-deploy}"
case "${COMMAND}" in
    deploy) deploy ;;
    diff) show_diff ;;
    delete) delete_deployment ;;
    status) show_status ;;
    -h|--help|help) usage ;;
    *)
        print_error "Unknown command: ${COMMAND}"
        usage
        exit 1
        ;;
esac
