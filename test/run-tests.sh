#!/bin/bash

echo "🚀 开始支付管理系统测试..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查MySQL是否运行
echo "📋 检查MySQL服务..."
if ! mysqladmin ping -h localhost -u root -p &> /dev/null; then
    echo "⚠️  MySQL服务可能未运行，请确保MySQL服务已启动"
    echo "   可以使用以下命令启动MySQL："
    echo "   sudo service mysql start"
    echo "   或"
    echo "   sudo systemctl start mysql"
fi

# 检查依赖是否安装
echo "📋 检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装根目录依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

# 检查环境配置文件
echo "📋 检查环境配置..."
if [ ! -f "server/.env" ]; then
    echo "⚠️  未找到 server/.env 文件"
    echo "   请复制 server/.env.example 为 server/.env 并配置数据库信息"
    echo "   示例配置："
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=3306"
    echo "   DB_NAME=payment_system"
    echo "   DB_USER=root"
    echo "   DB_PASSWORD=your_password"
    echo "   JWT_SECRET=your_jwt_secret_key"
    echo "   PORT=5000"
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器是否启动成功
if ! curl -s http://localhost:5000/api/auth/verify &> /dev/null; then
    echo "❌ 后端服务启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 后端服务启动成功"

# 运行API测试
echo "🧪 运行API测试..."
node test/test-system.js

# 停止后端服务
echo "🛑 停止后端服务..."
kill $SERVER_PID 2>/dev/null

echo "🎉 测试完成！"
echo ""
echo "📋 下一步："
echo "1. 启动前端服务：npm run client"
echo "2. 启动后端服务：npm run server"
echo "3. 访问 http://localhost:3000 进行前端功能测试"
echo "4. 参考 test/test-frontend.md 进行详细功能测试" 