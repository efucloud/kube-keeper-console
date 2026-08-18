#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_BIN="${DOCKER_BIN:-docker}"
DOCKERFILE="${DOCKERFILE:-${ROOT_DIR}/Dockerfile.local}"
IMAGE_REPO="${IMAGE_REPO:-registry.cn-shenzhen.aliyuncs.com/efucloud-public/kube-keeper-console}"
PUSH_LATEST="${PUSH_LATEST:-true}"
PLATFORM="${PLATFORM:-linux/amd64}"
DOCKER_BUILD_FLAGS="${DOCKER_BUILD_FLAGS:-}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-false}"

DEFAULT_IMAGE_TAG="v1.0.0"

if command -v git >/dev/null 2>&1 && git -C "${ROOT_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  LATEST_TAG="$(git -C "${ROOT_DIR}" tag --sort=-version:refname | head -n 1 || true)"
  if [[ "${LATEST_TAG}" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    DEFAULT_IMAGE_TAG="v${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))"
  fi
fi

IMAGE_TAG="${IMAGE_TAG:-${DEFAULT_IMAGE_TAG}}"

if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn command not found"
  exit 1
fi

if ! command -v "${DOCKER_BIN}" >/dev/null 2>&1; then
  echo "docker command not found: ${DOCKER_BIN}"
  exit 1
fi

if [[ ! -f "${DOCKERFILE}" ]]; then
  echo "dockerfile not found: ${DOCKERFILE}"
  exit 1
fi

if command -v git >/dev/null 2>&1 && git -C "${ROOT_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMIT="$(git -C "${ROOT_DIR}" rev-parse HEAD 2>/dev/null || printf unknown)"
else
  GIT_COMMIT="unknown"
fi

BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
IMAGE="${IMAGE_REPO}:${IMAGE_TAG}"

echo "Root dir: ${ROOT_DIR}"
echo "Dockerfile: ${DOCKERFILE}"
echo "Image repo: ${IMAGE_REPO}"
echo "Image tag: ${IMAGE_TAG}"
echo "Git commit: ${GIT_COMMIT}"
echo "Build date: ${BUILD_DATE}"

if [[ "${SKIP_FRONTEND_BUILD}" != "true" ]]; then
  echo "frontend build start"
  yarn --cwd "${ROOT_DIR}" build
fi

BUILD_ARGS=(
  buildx
  build
  -f "${DOCKERFILE}"
  --build-arg "GIT_COMMIT=${GIT_COMMIT}"
  --build-arg "BUILD_DATE=${BUILD_DATE}"
  --platform "${PLATFORM}"
  -t "${IMAGE}"
  --provenance=false
  --progress=plain
  --push
)

if [[ -n "${DOCKER_BUILD_FLAGS}" ]]; then
  # shellcheck disable=SC2206
  EXTRA_BUILD_FLAGS=(${DOCKER_BUILD_FLAGS})
  BUILD_ARGS+=("${EXTRA_BUILD_FLAGS[@]}")
fi

BUILD_ARGS+=("${ROOT_DIR}")

"${DOCKER_BIN}" "${BUILD_ARGS[@]}"

if [[ "${PUSH_LATEST}" == "true" ]]; then
  "${DOCKER_BIN}" buildx imagetools create \
    -t "${IMAGE_REPO}:latest" \
    "${IMAGE}"
fi

echo "build image success ${IMAGE}"
