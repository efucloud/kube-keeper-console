# 构建阶段
FROM registry.cn-shenzhen.aliyuncs.com/efucloud-public/node-python3:20-alpine AS builder

WORKDIR /app

# 1. 先只复制依赖文件（触发缓存）
COPY package.json yarn.lock ./

# 2. 安装依赖（含 devDependencies，因为 Umi 需要）
# 使用 --frozen-lockfile 确保一致性
ENV YARN_REGISTRY=https://registry.npmmirror.com
RUN yarn install --frozen-lockfile --non-interactive

# 3. 再复制源码（这一步变动频繁，放最后）
COPY . .

# 4. 执行构建
RUN yarn build


# 运行阶段
FROM registry.cn-shenzhen.aliyuncs.com/efucloud-public/nginx:1.29.4-alpine

ARG GIT_COMMIT
ARG BUILD_DATE

LABEL org.opencontainers.image.revision=${GIT_COMMIT}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL com.efucloud.build.commit=${GIT_COMMIT}
LABEL com.efucloud.build.date=${BUILD_DATE}

# 从 builder 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]