# 酒店管理系统后端

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
编辑 `.env` 文件，设置你的 PostgreSQL 数据库连接：
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/hotel_system?schema=public"
```

### 3. 生成 Prisma 客户端
```bash
npx prisma generate
```

### 4. 运行数据库迁移（可选）
```bash
npx prisma migrate dev
```

### 5. 启动开发服务器
```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

### 可用命令
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建项目
- `npm run start` - 启动生产服务器
- `npm run prisma:generate` - 生成 Prisma 客户端
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开 Prisma Studio

### API 端点
- `GET /health` - 健康检查

### 项目结构
```
src/
├── server.ts     # 主服务器文件
├── modules/      # 业务模块（待开发）
└── services/    # 服务层（待开发）

prisma/
└── schema.prisma # 数据库模型定义
```