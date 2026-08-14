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
IMAGE_TAG=v1.0.0.20260814 ./build.sh
PUSH_LATEST=false ./build.sh
PLATFORM=linux/amd64 ./build.sh
```

`build.sh` 会先执行前端构建，再使用 `Dockerfile.local` 生成并推送镜像到 `registry.cn-shenzhen.aliyuncs.com/efucloud-public/kube-keeper-console`。

## GitHub Workflow

仓库新增了前端 CI 流程：

- 分支 push / PR 时安装依赖并执行 `yarn build`
- 推送任意 tag 时构建并推送镜像到 `registry.cn-shenzhen.aliyuncs.com/efucloud-public/kube-keeper-console`

发布镜像前需要在 GitHub 仓库中配置以下 secrets：

- `ALIYUN_REGISTRY_USERNAME`
- `ALIYUN_REGISTRY_PASSWORD`
