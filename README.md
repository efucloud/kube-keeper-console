# kube-keeper-console
企业级Kubernetes集群管理系统前端

## 开发
```shell
yarn
yarn dev
```

## 本地构建镜像

```shell
./build.sh
```

可选参数：

```shell
IMAGE_TAG=v1.0.3 ./build.sh
PUSH_LATEST=false ./build.sh
PLATFORM=linux/amd64 ./build.sh
```

`build.sh` 会先执行前端构建，再使用 `Dockerfile.local` 生成并推送镜像到 `ghcr.io/efucloud/kube-keeper-console`。

默认情况下，`build.sh` 会基于当前仓库最新的 Git tag 自动递增 patch 版本号。
例如本地最新 tag 是 `v1.0.2` 时，默认镜像 tag 会使用 `v1.0.3`。

## GitHub Workflow

仓库新增了前端 CI 流程：

- 分支 push / PR 时安装依赖并执行 `yarn build`
- 推送任意 tag 时构建并推送镜像到 `ghcr.io/efucloud/kube-keeper-console`

发布时推荐使用递增的语义化 tag，例如：

```shell
git tag v1.0.3
git push origin v1.0.3
```

GitHub Actions 会直接使用内置的 `GITHUB_TOKEN` 推送镜像到 GitHub Container Registry，无需额外配置阿里云镜像仓库账号。
