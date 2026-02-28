# 酒店管理系统项目说明

## 项目概述

这是一个基于 Monorepo 架构的酒店管理系统，旨在提供完整的酒店业务管理解决方案。

## 技术栈

### 后端 (Backend)
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL + Prisma ORM
- **语言**: TypeScript
- **开发工具**: ts-node-dev, Prisma Studio

### 数据库
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **数据迁移**: Prisma Migration

### 前端 (待实现)
- 待确定

### 共享包 (待实现)
- 共享类型定义
- API 接口规范

## 项目结构

```
hotel-system/
├── apps/
│   ├── backend/          # 后端服务
│   │   ├── src/
│   │   │   ├── server.ts     # 主服务器文件
│   │   │   ├── modules/      # 业务模块
│   │   │   └── services/    # 服务层
│   │   ├── prisma/          # Prisma 相关文件
│   │   ├── package.json      # 后端依赖
│   │   └── tsconfig.json    # TypeScript 配置
│   └── frontend/         # 前端应用 (待实现)
├── packages/
│   └── shared-types/      # 共享类型定义 (待实现)
└── docs/                 # 项目文档
    └── PROJECT_CONTEXT.md # 本文档
```

## 功能模块规划

### 核心功能
1. **房间管理**
   - 房间类型管理（标准间、豪华间、套房等）
   - 房间状态管理（可用、预订、清洁中、维修中）
   - 房间设施管理

2. **预订管理**
   - 客人预订
   - 预订状态管理
   - 预订历史查询
   - 取消预订

3. **客人管理**
   - 客人信息维护
   - 会员管理
   - 客人偏好记录

4. **订单管理**
   - 入住登记
   - 退房结算
   - 账单管理
   - 支付处理

5. **员工管理**
   - 员工信息管理
   - 权限管理
   - 排班管理

6. **报表分析**
   - 入住率统计
   - 收入报表
   - 客流量分析
   - 财务报表

### 扩展功能
- 在线预订系统
- 客房服务管理
- 会议与活动管理
- 餐厅管理
- 停车场管理

## 开发指南

### 环境设置
1. 确保安装 Node.js (v18+)
2. 安装 PostgreSQL 数据库
3. 配置环境变量（.env 文件）

### 运行后端
```bash
cd apps/backend
npm install
npx prisma migrate dev  # 运行数据库迁移
npx prisma generate     # 生成 Prisma 客户端
npm run dev            # 启动开发服务器
```

### 数据库操作
- `npm run prisma:migrate` - 运行迁移
- `npm run prisma:studio` - 打开 Prisma Studio
- `npm run prisma:generate` - 生成客户端

### API 端点
- `GET /health` - 健康检查
- 更多 API 端点待实现

## 数据库设计（初步）

### 主要实体
- **用户表 (User)** - 系统用户和员工
- **客人表 (Guest)** - 酒店客人信息
- **房间表 (Room)** - 房间信息
- **房间类型表 (RoomType)** - 房间类型
- **预订表 (Booking)** - 预订信息
- **订单表 (Order)** - 入住订单
- **支付记录表 (Payment)** - 支付记录

## 部署计划

### 开发环境
- 本地开发服务器
- 本地 PostgreSQL 数据库

### 测试环境
- 测试服务器
- 测试数据库
- 自动化测试

### 生产环境
- 云服务器
- 生产数据库
- 负载均衡
- 监控与日志

## 团队协作

### 开发流程
1. 创建功能分支
2. 开发功能
3. 编写测试
4. 代码审查
5. 合并到主分支

### 代码规范
- 使用 ESLint 和 Prettier
- 遵循 TypeScript 最佳实践
- 编写清晰的注释
- 保持代码整洁

## 后续规划

1. **前端开发**: React/Vue.js 应用
2. **API 设计**: RESTful API 规范
3. **认证授权**: JWT 或 OAuth2
4. **缓存策略**: Redis 缓存
5. **消息队列**: 异步任务处理
6. **微服务架构**: 未来可考虑拆分

---

**项目创建日期**: 2026-02-27
**项目状态**: 初始结构搭建完成