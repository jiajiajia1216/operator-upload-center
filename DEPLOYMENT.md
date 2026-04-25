# Cloudflare Pages 部署指南

## 问题背景

Cloudflare Pages 的 GitHub 集成已失效，自动构建不触发（仓库 webhooks 数量为 0）。需要改用 GitHub Actions + Wrangler CLI 直接部署。

## 解决方案

使用 GitHub Actions 工作流，在每次推送到 main 分支时自动构建并部署到 Cloudflare Pages。

## 部署步骤

### 1. 设置 GitHub Secrets

在 GitHub 仓库中添加以下 Secret：

1. 进入仓库页面：https://github.com/jiajiajia1216/operator-upload-center
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 Secret：
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: `cfut_LoKFU4ztX3q4ch9mznlo7rqMXqRoWoEDtvwceZd10114400d`

### 2. 推送代码到 GitHub

由于网络限制，需要开启 VPN/梯子后执行以下命令：

```bash
cd /Users/jiajiajia/Documents/lingxi-claw/20260425-08-04-40-438
git push -u origin main
```

### 3. 验证部署

推送成功后，GitHub Actions 会自动运行：
1. 进入仓库页面：https://github.com/jiajiajia1216/operator-upload-center
2. 点击 **Actions** 标签页
3. 查看工作流运行状态

部署成功后，访问 https://operator-upload-center.pages.dev 查看最新版本。

## 工作流说明

新的 `.github/workflows/deploy.yml` 文件包含以下步骤：

1. **Checkout**: 检出代码
2. **Setup Node.js**: 安装 Node.js 20
3. **Install dependencies**: 安装 npm 依赖（包括 wrangler）
4. **Build**: 执行 `npm run build` 构建项目
5. **Verify build output**: 验证构建输出文件大小
6. **Deploy to Cloudflare Pages**: 使用 wrangler 部署到 Cloudflare Pages

## 关键配置

- **Cloudflare Account ID**: `90523b24b456db0abd6ca731b3c66e59`
- **项目名称**: `operator-upload-center`
- **部署命令**: `npx wrangler pages deploy dist --project-name=operator-upload-center`

## 故障排除

### 部署失败

1. 检查 GitHub Actions 日志中的错误信息
2. 确认 `CLOUDFLARE_API_TOKEN` Secret 已正确设置
3. 确认 Token 有 Pages 权限

### 构建失败

1. 检查 Node.js 版本是否为 20
2. 检查 npm 依赖是否完整
3. 检查构建命令是否正确

### 部署成功但代码未更新

1. 清除浏览器缓存
2. 检查 Cloudflare Pages 控制台中的部署历史
3. 确认部署的文件 hash 是否变化

## 相关链接

- GitHub 仓库: https://github.com/jiajiajia1216/operator-upload-center
- Cloudflare Pages: https://operator-upload-center.pages.dev
- Cloudflare 控制台: https://dash.cloudflare.com/90523b24b456db0abd6ca731b3c66e59/pages/view/operator-upload-center