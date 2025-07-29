#!/bin/bash

echo "🚀 开始部署支付管理系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL未安装，请先安装MySQL"
    exit 1
fi

echo "✅ 环境检查完成"

# 安装依赖
echo "📦 安装依赖..."
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p server/uploads
mkdir -p server/logs

# 复制环境配置文件
echo "⚙️ 配置环境..."
if [ ! -f "server/.env" ]; then
    cp server/env.production.example server/.env
    echo "⚠️ 请编辑 server/.env 文件，配置数据库连接信息"
fi

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
cd server
node scripts/migrate.js
cd ..

# 构建前端
echo "🏗️ 构建前端..."
cd client
npm run build
cd ..

echo "🎉 部署完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 server/.env 文件，配置数据库连接信息"
echo "2. 启动后端服务：cd server && npm start"
echo "3. 启动前端服务：cd client && npm start"
echo ""
echo "🌐 访问地址："
echo "- 前端：http://localhost:3000"
echo "- 后端：http://localhost:5000"
echo ""
echo "🔑 默认管理员账户："
echo "- 用户名：知行"
echo "- 密码：Zhixing Universal Trading Signal" 