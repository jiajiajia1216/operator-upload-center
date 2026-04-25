#!/bin/bash

# 一键部署脚本
# 使用方法：开启VPN/梯子后运行 ./deploy.sh

set -e

echo "=== 开始部署到 GitHub ==="

# GitHub配置
GITHUB_TOKEN="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"
REPO_OWNER="jiajiajia1216"
REPO_NAME="operator-upload-center"
REPO_URL="https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 配置远程仓库
echo "配置远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# 添加所有更改
echo "添加文件..."
git add .

# 提交更改
echo "提交更改..."
git commit -m "更新 GitHub Actions 部署工作流" --allow-empty

# 推送到GitHub
echo "推送到 GitHub..."
echo "注意：如果超时，请检查VPN/梯子是否正常工作"
git push -u origin main --force

echo "=== 部署完成 ==="
echo "GitHub Actions 将自动运行部署到 Cloudflare Pages"
echo "查看部署状态：https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
echo "访问线上版本：https://operator-upload-center.pages.dev"