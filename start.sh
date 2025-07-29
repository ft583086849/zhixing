#!/bin/bash

echo "🚀 启动支付管理系统..."

# 检查环境配置文件
if [ ! -f "server/.env" ]; then
    echo "❌ 环境配置文件不存在，请先运行部署脚本：./deploy.sh"
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务..."
cd server
npm start &
SERVER_PID=$!
cd ..

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 启动前端服务
echo "🎨 启动前端服务..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo "✅ 服务启动完成！"
echo ""
echo "🌐 访问地址："
echo "- 前端：http://localhost:3000"
echo "- 后端：http://localhost:5000"
echo ""
echo "🔑 默认管理员账户："
echo "- 用户名：知行"
echo "- 密码：Zhixing Universal Trading Signal"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait 