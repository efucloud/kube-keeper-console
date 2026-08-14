# kube-keeper-console

[English](./README.en.md)

企业级 Kubernetes 集群管理系统前端。

## 开发

安装依赖：

```shell
yarn install --frozen-lockfile
```

启动开发环境：

```shell
yarn dev
```

执行生产构建：

```shell
yarn build
```

## Docker 镜像

仓库根目录提供 [Dockerfile](/Users/cloudy/Documents/efucloud/kube-keeper-console/Dockerfile) 用于构建发布镜像。

镜像发布由 GitHub Actions 执行，目标仓库为 `ghcr.io/efucloud/kube-keeper-console`。

## GitHub Workflow

仓库包含以下自动化流程：

- 分支 push / PR 时安装依赖并执行 `yarn build`
- 推送 Git tag 时基于根目录 `Dockerfile` 构建并发布镜像到 `ghcr.io/efucloud/kube-keeper-console`

## 发布

推荐使用递增的语义化版本 tag，例如：

```shell
git tag v1.0.4
git push origin v1.0.4
```

推送 tag 后，GitHub Actions 会自动构建并发布对应版本镜像以及 `latest` 标签。
