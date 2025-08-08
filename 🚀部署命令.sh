#!/bin/bash
# 🚀 部署修复确认订单逻辑的代码

echo "=========================================="
echo "🚀 开始部署修复确认订单逻辑"
echo "=========================================="

# 1. 进入项目目录
cd /Users/zzj/Documents/w

# 2. 确认修改的文件
echo "📋 修改的文件："
echo "  - client/src/services/api.js"

# 3. 添加修改到git
git add client/src/services/api.js

# 4. 提交修改
git commit -m "🔧 修复确认订单状态判断逻辑

- 添加 confirmed_config 到确认订单状态列表
- 修复销售管理页面确认订单金额计算
- 修复数据概览页面佣金和销售业绩统计
- 88测试员一级的确认订单金额现在能正确显示"

# 5. 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin main

# 6. 触发Vercel自动部署
echo "✅ 代码已推送，Vercel将自动部署"
echo "🔗 部署状态查看: https://vercel.com/dashboard"

echo "=========================================="
echo "📊 部署完成后验证："
echo "1. 访问 https://zhixing-seven.vercel.app/admin/sales"
echo "   - 检查88测试员一级的确认订单金额是否为 $188"
echo "   - 检查应返佣金额是否为 $75.2"
echo ""
echo "2. 访问 https://zhixing-seven.vercel.app/admin/dashboard"
echo "   - 检查销售返佣金额是否大于0"
echo "   - 检查一级/二级销售业绩是否正确显示"
echo "=========================================="
