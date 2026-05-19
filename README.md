## 1. 项目介绍

**AgentTest-All-u-Need**-你想要的一切测试。一个用于评测 AI 对话 Agent 的全栈系统前端。提供 Agent 管理、LLM 模型配置、题库管理、评测任务执行及报告可视化等完整功能，帮助团队系统化评估和对比不同 AI Agent 的表现。

- **技术栈**：Vue 3 + TypeScript + Vite + Tailwind CSS + Pinia + Vue Router + ECharts
- **后端项目**：AgentTest-all-u-need-java（Spring Boot 3 + MyBatis-Plus + MySQL 8.0）
- **设计风格**：支持亮色 / 暗色双主题切换，响应式布局

## 2. 项目截图

### 亮色

- 仪表盘
<img width="1910" height="873" alt="image" src="https://github.com/user-attachments/assets/22b740cc-6e6d-46a8-b759-7e9f7e9b753b" />

- 休息页
<img width="1910" height="873" alt="image" src="https://github.com/user-attachments/assets/9b8ceff6-5bbe-4acd-86ca-c3d3fac412d6" />

- Agent管理
<img width="1919" height="881" alt="image" src="https://github.com/user-attachments/assets/b0fb055c-f4a7-4e34-813c-7770ed507cab" />

- 新建Agent
<img width="846" height="798" alt="image" src="https://github.com/user-attachments/assets/cb434fc2-43f2-4ad4-aaf4-327f9bb8178c" />
<img width="854" height="795" alt="image" src="https://github.com/user-attachments/assets/c3715af3-6eff-40b1-892f-fc2b6b079b1a" />

-AI生成题库
<img width="582" height="671" alt="image" src="https://github.com/user-attachments/assets/e85cedc9-ae81-4c4c-ba08-50a6d6940e1d" />

- 测出报告
<img width="1919" height="880" alt="image" src="https://github.com/user-attachments/assets/f30168f9-c375-4d1d-997c-5340edeebe07" />


### 暗色

- 仪表盘
<img width="1919" height="880" alt="image" src="https://github.com/user-attachments/assets/64f7b645-bcbf-42b1-bc00-f1e106f3590a" />


- 休息页
<img width="1919" height="887" alt="image" src="https://github.com/user-attachments/assets/f2a1b11c-686c-4854-9428-4aeac898c451" />



## 3. 项目功能

### 仪表盘
- 平台核心数据概览（Agent 总数、评测次数、平均得分等）
- ECharts 可视化图表展示评测趋势与分布

### Agent 管理
- Agent 列表分页展示，支持关键词搜索、类型筛选
- 新建 / 编辑 / 删除 Agent，配置名称、描述、类型、鉴权凭证
- Agent 详情页：查看配置、测试连接状态、关联的评测记录

### LLM 模型管理
- 大语言模型配置的增删改查
- 模型信息维护（名称、提供商、API 端点等）

### 题库管理
- 评测题目的增删改查，支持分类筛选与搜索
- 题目难度标签、预期答案管理

### 评测任务
- 创建评测任务：选择 Agent + 模型 + 题库组合
- 评测进度追踪，任务状态实时更新
- 评测详情页展示逐题对比结果

### 评测报告
- 评测结果可视化（分数分布、Agent 对比图）
- 多维度评分明细展示

### 休息一下
- 提供休息页面，工作中切换放松

## 4. 部署指南

### 环境要求

- Node.js 18+
- npm 9+

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器运行在 `http://localhost:5173`，API 请求自动代理到 `http://localhost:8080`。

### 环境变量

| 文件 | 用途 |
|------|------|
| `.env` | 公共变量 |
| `.env.development` | 开发环境 |
| `.env.production` | 生产环境 |

### 生产构建

```bash
# 类型检查 + 构建
npm run build
```

构建产出在 `dist/` 目录，可直接部署到任意静态服务器（Nginx、CDN 等）。

生产构建采用分包策略：
- `vue-vendor` — Vue + Vue Router + Pinia（稳定依赖，长期缓存）
- `echarts-vendor` — ECharts（体积较大，独立拆分）
- 业务代码按路由懒加载，首屏仅加载必需资源


```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/agent-eval/dist;
    index index.html;

    # SPA 路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 项目结构

```
src/
├── api/          # API 请求层（按模块拆分）
├── assets/       # 样式 / 图片 / 字体
├── components/   # 可复用组件
├── config/       # 应用配置
├── constants/    # 常量定义
├── layouts/      # 布局组件（侧边栏 / 顶栏）
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
├── types/        # TypeScript 类型定义
├── utils/        # 工具函数
├── views/        # 页面组件
│   ├── agent/       # Agent 管理
│   ├── dashboard/   # 仪表盘
│   ├── error/       # 404 等错误页
│   ├── evaluation/  # 评测任务
│   ├── llm/         # LLM 模型管理
│   ├── question/    # 题库管理
│   ├── relax/       # 休息一下
│   └── report/      # 评测报告
├── App.vue       # 根组件
└── main.ts       # 应用入口
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm run type-check` | TypeScript 类型检查 |
