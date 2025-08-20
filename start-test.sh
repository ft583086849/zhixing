#!/bin/bash

echo "🚀 启动测试环境..."
echo "================================"
echo "测试页面访问地址："
echo "--------------------------------"
echo "数据概览: http://localhost:3000/test"
echo "订单管理: http://localhost:3000/test/orders"
echo "销售管理: http://localhost:3000/test/sales"
echo "客户管理: http://localhost:3000/test/customers"
echo "资金统计: http://localhost:3000/test/finance"
echo "一级销售对账: http://localhost:3000/test/reconciliation/primary"
echo "二级销售对账: http://localhost:3000/test/reconciliation/secondary"
echo "================================"
echo ""
echo "⚠️  注意：这是测试环境，所有更改都不会影响生产环境"
echo ""

# 复制测试环境变量
cp .env.test .env.local

# 启动开发服务器
cd client
npm start