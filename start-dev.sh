#!/bin/bash

echo "🚀 启动酒店管理系统开发环境..."
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

# 启动后端服务
echo "📡 启动后端服务..."
cd apps/backend
unset HTTP_PROXY HTTPS_PROXY
npm run dev &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID) - http://localhost:3001"

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 启动前端服务
echo ""
echo "🌐 启动前端服务..."
cd ../frontend
unset HTTP_PROXY HTTPS_PROXY
npm start &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID) - http://localhost:3000"

echo ""
echo "=================================="
echo "🎉 开发环境启动成功！"
echo "📱 前端地址: http://localhost:3000"
echo "🔗 后端API: http://localhost:3001"
echo "💻 健康检查: http://localhost:3001/health"
echo "=================================="
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
wait