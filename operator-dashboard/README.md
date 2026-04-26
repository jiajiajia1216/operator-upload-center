# 操盘手数据看板系统

一个基于React + Vite + TypeScript的H5应用，包含今日/月度/排名数据看板和飞书表单跳转功能。

## 功能特性

- **分角色管理**：操盘手、运营经理、管理员不同权限
- **数据看板**：今日数据、月度数据、排名看板
- **动作中心**：飞书表单跳转（巡店、通报、会议、培训）
- **管理后台**：数据上传、用户管理、权限控制
- **移动端优先**：响应式设计，优先适配手机端

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装与运行

```bash
# 进入项目目录
cd operator-dashboard

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 访问地址

- 本地访问：http://localhost:5173
- 局域网访问：http://192.168.3.14:5173

## 目录结构

```
operator-dashboard/
├── src/
│   ├── components/       # 公共组件
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── TabBar.tsx
│   ├── pages/           # 页面组件
│   │   ├── Login.tsx
│   │   ├── TodayData.tsx
│   │   ├── MonthlyData.tsx
│   │   ├── Ranking.tsx
│   │   ├── Actions.tsx
│   │   └── Admin.tsx
│   ├── store/           # Zustand状态管理
│   │   └── useStore.ts
│   ├── utils/           # 工具函数
│   │   └── storage.ts
│   ├── types/           # TypeScript类型定义
│   │   └── index.ts
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 入口文件
├── public/              # 静态资源
├── index.html           # HTML模板
├── package.json         # 依赖配置
├── vite.config.ts       # Vite配置
├── tailwind.config.ts   # Tailwind配置
├── tsconfig.json        # TypeScript配置
└── .github/workflows/   # GitHub Actions部署
```

## 技术栈

- **前端框架**：React 18 + Vite + TypeScript
- **UI/样式**：Tailwind CSS
- **状态管理**：Zustand
- **路由**：React Router v7
- **数据存储**：localStorage + Excel/CSV文件上传
- **部署**：GitHub + Cloudflare Pages

## 角色权限

| 角色 | 标签页 | 数据上传 | 用户管理 | 权限控制 |
|------|--------|----------|----------|----------|
| 操盘手 | 今日/月度/排名/动作 | ❌ | ❌ | ❌ |
| 运营经理 | 今日/月度/排名 | ❌ | ❌ | ❌ |
| 管理员 | 今日/月度/排名/动作/管理 | ✅ | ✅ | ✅ |

## 部署方式

项目配置了GitHub Actions自动部署到Cloudflare Pages：

1. 推送代码到GitHub仓库
2. GitHub Actions自动构建
3. 部署到Cloudflare Pages
4. 访问 https://operator-upload-center.pages.dev

## 开发说明

### 数据上传

管理员可以通过管理后台上传Excel/CSV文件更新数据：
- 今日数据：日度指标
- 月度数据：月度汇总
- 排名数据：操盘手排名

### 表单跳转

动作中心提供飞书表单跳转功能：
- 巡店记录
- 数据通报
- 会议记录
- 培训记录

## 许可证

MIT License