# Web Builder 计划

## 项目概况
- **项目名称**：爱回收数据看板与表单跳转系统
- **一句话描述**：包含今日/月度/排名数据看板和飞书表单跳转功能的H5应用
- **项目原型**：spa
- **当前阶段**：Phase 5 - 启动交付

---

## 需求采集记录 (Phase 0)

### 已确认需求
- [x] 项目目标和目标用户：数据看板与管理后台，操盘手/运营经理/管理员
- [x] 核心功能 / 页面列表：不同角色看到不同标签页，管理员有管理功能
- [x] 设计风格偏好：当前风格，调整内容
- [x] 是否需要后端（是/否）：无后端，纯前端应用
- [x] 是否需要用户认证（是/否）：需要登录，延续现有登录方式
- [x] 移动端适配：优先适配手机端，其次网页
- [x] 部署方式：沿用GitHub部署到Cloudflare Pages

### 用户回答
> 第一轮回答：
> 1. 做什么：不同角色对应不同功能，分层管理，要有数据看板
> 2. 给谁用：操盘手、运营经理、管理员
> 3. 参考风格：当前的风格就可以，调整内容
>
> 第二轮回答：
> 1. 核心功能：
>    - 操盘手：今日/月度/排名/动作四个标签页
>    - 运营经理：今日/月度/排名三个标签页
>    - 管理员：今日/月度/排名/管理四个标签页
>    - 管理员的管理功能包含：数据上传、用户管理、权限控制
> 2. 数据来源：手动上传Excel、CSV格式
> 3. 需要登录：延续现在登录方式和人员架构
>
> 第三轮回答：
> 1. 技术栈：回忆之前开发内容（React + Vite + TypeScript + Tailwind CSS）
> 2. 移动端适配：优先适配手机端，其次网页
> 3. 部署方式：沿用GitHub部署
>
> 原始需求：
> 今日：日度数据，管理员可上传数据源，上传后刷新数据
> 月度：类似今日，每日更新数据
> 排名：给数据源，直接更新数据
> 动作：飞书表单跳转页面，操盘手点击直接跳转到飞书表单

---

## 技术方案 (Phase 1)

| 层级 | 选型 | 理由 |
|------|------|------|
| 前端框架 | React 18 + Vite + TypeScript | 现代化、类型安全、与现有系统一致 |
| UI/样式 | Tailwind CSS | 快速开发、响应式设计、移动端优先 |
| 状态管理 | Zustand | 轻量级、易用、适合中小型应用 |
| 路由 | React Router v7 | 官方路由库、功能完善 |
| 后端 | 无（纯前端） | 数据通过Excel/CSV文件上传更新 |
| 数据库 | 无（使用localStorage） | 简单部署、无需服务器、与现有系统一致 |
| 部署 | GitHub + Cloudflare Pages | 与现有系统一致、自动部署 |

### 本地启动方式
```bash
cd operator-dashboard
npm install
npm run dev
```

### 目录结构
```
operator-dashboard/
├── src/
│   ├── components/       # 公共组件
│   ├── pages/           # 页面组件
│   ├── store/           # Zustand状态管理
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型定义
│   ├── context/         # React Context
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

---


## 设计规格 (Phase 2)

基于现有系统风格，采用现代简约设计，优先移动端适配。

### 色彩系统
```css
:root {
  /* 主色调 - 紫色渐变 */
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --primary-dark: #764ba2;

  /* 中性色 */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;

  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-card: #ffffff;

  /* 状态色 */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* 边框和阴影 */
  --border-color: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

### 字体
- 主字体：系统默认字体栈（-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif）
- 等宽字体：用于数字显示（SF Mono, Monaco, 'Cascadia Code', monospace）

### 间距系统
- 基础单位：4px
- 常用间距：4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px

### 组件设计原则
- 移动端优先：所有组件优先适配手机屏幕
- 触控友好：按钮和交互元素最小尺寸44px
- 视觉层次：通过颜色、大小、间距建立清晰层次
- 一致性：复用现有设计风格

---

## 页面与组件规划 (Phase 2)

### 路由表
| 路由 | 页面名 | 描述 | 状态 |
|------|--------|------|------|
| / | 今日数据 | 日度数据看板，管理员可上传数据 | 待实现 |
| /monthly | 月度数据 | 月度数据看板，每日更新 | 待实现 |
| /ranking | 排名看板 | 操盘手排名数据 | 待实现 |
| /actions | 动作中心 | 飞书表单跳转页面 | 待实现 |
| /admin | 管理后台 | 数据上传、用户管理、权限控制 | 待实现 |
| /login | 登录页面 | 用户登录 | 待实现 |

### 页面区块

#### 今日数据页 `/`
- [ ] 顶部导航栏：Logo、用户信息、退出按钮
- [ ] 标签页切换：今日/月度/排名/动作（根据角色显示不同标签）
- [ ] 数据概览卡片：关键指标展示
- [ ] 数据表格：今日详细数据
- [ ] 图表区域：数据可视化
- [ ] 管理员功能：数据上传按钮（仅管理员可见）

#### 月度数据页 `/monthly`
- [ ] 顶部导航栏
- [ ] 月份选择器
- [ ] 月度数据概览
- [ ] 月度趋势图表
- [ ] 月度数据明细

#### 排名看板页 `/ranking`
- [ ] 顶部导航栏
- [ ] 排名筛选器：按区域、时间等
- [ ] 排名列表：操盘手排名
- [ ] 排名详情：点击展开详情

#### 动作中心页 `/actions`
- [ ] 顶部导航栏
- [ ] 表单分类：巡店、通报、会议、培训
- [ ] 表单卡片：点击跳转飞书表单
- [ ] 最近提交记录

#### 管理后台页 `/admin`（仅管理员）
- [ ] 顶部导航栏
- [ ] 管理标签页：数据上传、用户管理、权限控制
- [ ] 数据上传：Excel/CSV文件上传
- [ ] 用户管理：用户列表、新增、编辑、删除
- [ ] 权限控制：角色分配、权限设置

#### 登录页 `/login`
- [ ] 登录表单：用户名、密码
- [ ] 角色选择：操盘手、运营经理、管理员
- [ ] 登录按钮

### 共享组件
- [ ] `AppLayout`：主布局组件，包含导航栏和内容区域
- [ ] `TabBar`：底部标签栏，移动端导航
- [ ] `Header`：顶部导航栏
- [ ] `Card`：卡片组件，用于数据展示
- [ ] `Button`：按钮组件，多种样式变体
- [ ] `Table`：数据表格组件
- [ ] `Chart`：图表组件，数据可视化
- [ ] `FileUpload`：文件上传组件
- [ ] `Modal`：模态框组件
- [ ] `Toast`：提示消息组件

### 数据模型

#### 用户数据
```typescript
interface User {
  id: string;
  name: string;
  role: 'operator' | 'manager' | 'admin';
  region?: string;
  city?: string;
  storeId?: string;
}
```

#### 今日数据
```typescript
interface TodayData {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  metrics: {
    patrolCount: number;
    reportCount: number;
    meetingCount: number;
    trainingCount: number;
    // ... 其他指标
  };
}
```

#### 月度数据
```typescript
interface MonthlyData {
  id: string;
  operatorId: string;
  operatorName: string;
  month: string;
  totalMetrics: {
    patrolCount: number;
    reportCount: number;
    meetingCount: number;
    trainingCount: number;
    // ... 其他指标
  };
}
```

#### 排名数据
```typescript
interface RankingData {
  id: string;
  operatorId: string;
  operatorName: string;
  region: string;
  score: number;
  rank: number;
  metrics: Record<string, number>;
}
```

#### 飞书表单
```typescript
interface FeishuForm {
  id: string;
  name: string;
  url: string;
  description: string;
  category: 'patrol' | 'report' | 'meeting' | 'training';
}
```


## 页面与组件规划 (Phase 2)

### 路由表
| 路由 | 页面名 | 描述 | 状态 |
|------|--------|------|------|
| / | 今日数据 | 日度数据看板，管理员可上传数据 | 待实现 |
| /monthly | 月度数据 | 月度数据看板，每日更新 | 待实现 |
| /ranking | 排名看板 | 操盘手排名数据 | 待实现 |
| /actions | 动作中心 | 飞书表单跳转页面 | 待实现 |

### 页面区块
<!-- 每个页面拆解至区块级别，描述具体内容，例如：
#### 首页 `/`
- [ ] Hero 区：主标题 + 副标题 + CTA 按钮
- [ ] 特性展示：3-4 张卡片
- [ ] 底部 CTA
-->

### 共享组件
<!-- Header、Footer、Sidebar、Card、Button 等，列出变体和状态 -->

### 数据模型（如有后端）
<!-- 类型定义或数据库 Schema -->

---

## 实现进度 (Phase 3)

### 基础设施
- [x] 项目结构（目录、配置文件、依赖管理文件）
- [x] 全局样式 / Design Tokens
- [x] 布局组件（AppLayout, Header, TabBar）
- [x] 路由配置
- [x] 状态管理（Zustand store）
- [x] 类型定义（TypeScript interfaces）

### 页面实现
#### 登录页面 `/login`
- [x] 登录表单组件
- [x] 角色选择
- [x] 登录逻辑

#### 今日数据页 `/`
- [x] 数据概览卡片
- [x] 数据表格
- [x] 管理员数据上传

#### 月度数据页 `/monthly`
- [x] 月份选择器
- [x] 月度数据概览

#### 排名看板页 `/ranking`
- [x] 排名筛选器
- [x] 排名列表

#### 动作中心页 `/actions`
- [x] 表单分类
- [x] 表单卡片
- [x] 最近提交记录

#### 管理后台页 `/admin`
- [x] 数据上传功能
- [x] 用户管理
- [x] 权限控制

### 共享组件
- [ ] AppLayout
- [ ] TabBar
- [ ] Header
- [ ] Card
- [ ] Button
- [ ] Table
- [ ] Chart
- [ ] FileUpload
- [ ] Modal
- [ ] Toast

---

## 验证与收尾 (Phase 4)

### 启动验证
- [x] 依赖安装成功
- [x] 构建通过
- [x] 开发服务器正常启动
- [ ] 所有路由可访问，页面正常渲染
- [ ] 浏览器控制台无红色错误
- [ ] 后端 API 正常返回数据（如有）

### 打磨清单
- [ ] 响应式适配（手机 / 平板 / 桌面）
- [ ] 所有交互元素有 hover/active/focus 状态
- [ ] 加载状态（不能白屏）
- [ ] 错误状态
- [ ] 空状态
- [ ] 表单验证
- [ ] favicon
- [ ] README.md（含环境要求、安装与启动步骤、目录说明）

---

## 启动交付 (Phase 5)

- [x] 开发服务器保持后台运行
- [x] 本地访问链接已输出（Markdown 超链接格式）
- [x] 局域网访问链接已输出（Markdown 超链接格式）
- [x] 项目已完成并交付
