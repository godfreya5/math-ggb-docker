# 数学备课助手 - Docker 部署

## 环境要求

- **Docker Desktop** (Windows/Mac) 或 Docker Engine (Linux)
- 下载地址：https://www.docker.com/products/docker-desktop

## 快速开始（推荐）

```bash
# 1. 进入项目目录
cd math-ggb-docker

# 2. 配置 API Key（编辑 backend/.env 文件）
#    至少需要填写 LLM_API_KEY

# 3. 一键启动
docker compose up -d

# 4. 打开浏览器访问
#    http://localhost:8765
```

## 停止与重启

```bash
# 停止
docker compose down

# 重启
docker compose up -d
```

## 配置说明

编辑 `backend/.env` 文件：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| LLM_PROVIDER | AI 服务商 (zhipu/qwen/deepseek) | zhipu |
| LLM_API_KEY | API 密钥 | - |
| LLM_BASE_URL | API 地址 | 智谱默认地址 |
| LLM_MODEL | 模型名称 | glm-4v |
| SECRET_KEY | JWT 签名密钥 | change-me（生产环境请修改） |
| JWT_EXPIRE_HOURS | 登录有效期（小时） | 168 |

修改配置后重启容器生效：`docker compose down && docker compose up -d`

## 数据持久化

- 数据库文件、上传的图片、运行时配置均保存在 `./data/` 目录
- 删除 `./data/` 目录可重置所有数据
- 备份 `./data/` 目录即可备份全部用户数据

## 镜像导出/导入（离线分发）

```bash
# 导出镜像（在构建机器上）
docker save math-ggb-docker-app | gzip > math-ggb-app.tar.gz

# 导入镜像（在目标机器上）
docker load < math-ggb-app.tar.gz
docker compose up -d
```

## 常见问题

**Q: 启动后无法访问？**
- 确认 Docker Desktop 已启动
- 检查端口 8765 是否被占用

**Q: 分析图片报错？**
- 检查 API Key 是否正确配置
- 检查 API 账户余额是否充足

**Q: 如何更新版本？**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```
