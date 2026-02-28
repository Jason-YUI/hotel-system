# 酒店管理系统前端

## 快速开始

### 1. 启动开发环境

在项目根目录运行：
```bash
./start-dev.sh
```

这将同时启动：
- ✅ 前端服务：http://localhost:3000
- ✅ 后端服务：http://localhost:3001

### 2. 手动启动（可选）

#### 启动后端
```bash
cd apps/backend
npm install
unset HTTP_PROXY HTTPS_PROXY
npm run dev
```

#### 启动前端
```bash
cd apps/frontend
npm install
unset HTTP_PROXY HTTPS_PROXY
npm start
```

## 功能页面

### 🏠 首页 (/)
- 系统概览
- 实时数据展示
- 系统状态监控

### 🏨 房间管理 (/rooms)
- 房间列表管理
- 房间状态更新
- 房间类型统计

### 📅 预订管理 (/bookings)
- 预订列表查看
- 预订状态管理
- 快速搜索功能

### 👥 客人管理 (/guests)
- 开发中...

### 📊 报表统计 (/reports)
- 开发中...

## 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **Create React App** - 开发工具

## 开发指南

### 添加新页面
1. 在 `src/components/` 创建新的组件
2. 在 `App.tsx` 中添加路由
3. 更新导航菜单

### API 集成
API 客户端配置在 `src/api/client.ts`：
```typescript
import { api } from './api/client';

// 获取房间列表
const rooms = await api.getRooms();

// 创建预订
const booking = await api.createBooking(data);
```

### 环境变量
编辑 `.env` 文件：
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

## 项目结构
```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts      # API 客户端配置
│   ├── components/
│   │   ├── HotelDashboard.tsx
│   │   ├── RoomManagement.tsx
│   │   └── BookingManagement.tsx
│   ├── App.tsx            # 主应用组件
│   └── App.css            # 全局样式
├── public/                # 静态资源
├── package.json           # 依赖配置
└── .env                  # 环境变量
```

## 停止服务

按 `Ctrl+C` 停止所有服务，或使用：
```bash
pkill -f "npm run dev"
pkill -f "npm start"
```

## 故障排除

### 端口占用
如果端口被占用，修改：
- 前端端口：编辑 `package.json` 中的 `PORT=3000`
- 后端端口：编辑 `backend/src/server.ts` 中的端口

### 网络问题
如果遇到网络连接问题：
```bash
unset HTTP_PROXY HTTPS_PROXY
```

### 依赖问题
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```