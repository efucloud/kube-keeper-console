# kube-keeper-console

[简体中文](./README.md)

Enterprise frontend for Kubernetes cluster management.

## Development

Install dependencies:

```shell
yarn install --frozen-lockfile
```

Start the development server:

```shell
yarn dev
```

Run a production build:

```shell
yarn build
```

## Docker Image

The repository includes a root-level [Dockerfile](/Users/cloudy/Documents/efucloud/kube-keeper-console/Dockerfile) for release image builds.

Image publishing is handled by GitHub Actions and targets `ghcr.io/efucloud/kube-keeper-console`.

## GitHub Workflow

The repository includes the following automation:

- On branch push / pull request, install dependencies and run `yarn build`
- On Git tag push, build and publish the image from the root `Dockerfile` to `ghcr.io/efucloud/kube-keeper-console`

## Release

Use an incremented semantic version tag, for example:

```shell
git tag v1.0.4
git push origin v1.0.4
```

After the tag is pushed, GitHub Actions will automatically build and publish the versioned image and the `latest` tag.
