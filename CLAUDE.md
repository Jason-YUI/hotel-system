# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Monorepo 项目，包含两个应用：
- `apps/frontend/` — React 19 + TypeScript CRA SPA，端口 **3000**
- `apps/backend/` — Express 4 + TypeScript + Prisma 6 + PostgreSQL，端口 **3001**

前端数据目前为**内存 mock 状态**，除了 `GET /health` 外暂无真实 API。添加功能需要：
1. 在 `apps/backend/src/modules/<resource>/` 实现 Express 路由，挂载到 `server.ts`
2. 在对应组件中用 `useEffect` + `api.<method>()` 替换 `useState(INITIAL_DATA)`

## 常用命令

```bash
# 启动前后端开发服务器
bash start-dev.sh

# 后端 (apps/backend/)
npm run dev              # ts-node-dev 热重载
npm run prisma:migrate    # 执行数据库迁移
npm run prisma:studio    # 打开 Prisma Studio GUI
npm run prisma:generate  # 生成 Prisma 客户端
npx tsc --noEmit         # 类型检查

# 前端 (apps/frontend/)
npm start                # localhost:3000
npm test                 # Jest + Testing Library
npx tsc --noEmit         # 类型检查
```

## 代码规范

- **Section banners** 分割文件区域：`// ─── Types ───`、`// ─── Constants ───`、`// ─── Main Component ───`
- **状态/类型值**使用中文字符串：`"可用" | "已入住" | "清洁中"`，不使用 TypeScript enum
- **常量**使用 `SCREAMING_SNAKE_CASE`：`INITIAL_ROOMS`、`STATUS_COLORS`、`DEFAULT_FORM`
- **ID 类型**：`string` — Prisma 用 `cuid()`，mock 数据用 `Date.now().toString()`
- 每个 React 组件使用 `React.FC`，使用 `useCallback` 包装耗时回调

## 组件模式

页面组件布局（参考 `RoomManagement.tsx`）：
1. Types → Constants → `React.FC` with state → handlers → JSX

**表单验证**：始终有 `validate(): boolean` 函数填充 `formErrors` 状态；`handleSave()` 在 `!validate()` 时提前返回。每个字段下方渲染内联错误信息。

**CSV 导出**：每个列表页面通过 `useCallback` 导出；为 Excel/中文兼容 prepend `"\uFEFF"` BOM。

**Toast 通知**：`{ msg, type: "success"|"error" } | null` 状态，3秒后自动清除，渲染在 `fixed top-6 right-6 z-50`。

**所有页面使用 `<Layout>` 组件**，不要添加独立的 header 或 nav。

## 集成点

- 前端 API 调用通过 [api/client.ts](apps/frontend/src/api/client.ts)，使用 `api.<resource>.<method>()`
- `REACT_APP_API_URL`（前端）和 `PORT` / `FRONTEND_URL`（后端）控制连接
- 后端 CORS 仅允许 `FRONTEND_URL` 源；修改环境变量而非扩大 `cors()` 配置
- 规划 REST 路径：`/api/rooms`、`/api/bookings`、`/api/guests`、`/api/dashboard`、`/api/stats?range=30d`
- Prisma 模型：`Room`、`Booking`、`Guest`、`User`、`Order`、`Service`、`ServiceOrder`