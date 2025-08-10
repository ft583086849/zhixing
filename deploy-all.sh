#!/bin/bash

echo "🚀 开始部署 v2.7.0 + v2.8.0 综合更新"
echo "================================================"
echo ""
echo "📋 版本信息："
echo "- v2.7.0: 综合优化更新"
echo "- v2.8.0: 资金统计增强和订单统计优化"
echo ""
echo "📝 主要更新内容："
echo ""
echo "【v2.7.0 更新】"
echo "1. ✅ 修复订单重复计算问题（Map去重）"
echo "2. ✅ 优化待返佣状态逻辑"
echo "3. ✅ 改进收款地址显示（缩短显示，增大复制按钮）"
echo "4. ✅ 购买页面TRC20改为ERC20"
echo "5. ✅ 二级销售页面响应式优化"
echo "6. ✅ 链名占位符更新为BSC（BEP20）、ERC20"
echo "7. ✅ 二级销售默认佣金率修复为25%"
echo ""
echo "【v2.8.0 更新】"
echo "1. ✅ 7天免费订单不计入待付款确认统计"
echo "2. ✅ 资金统计新增总实付金额列"
echo "3. ✅ 分配金额改为基于总实付金额计算"
echo "4. ✅ 公户下添加营销、分红、开发费用子项"
echo ""
echo "⚠️ 重要提醒："
echo "1. 必须先在Supabase执行SQL脚本"
echo "2. 分配金额计算基准已从营利金额改为总实付金额"
echo "3. 二级销售默认佣金率统一为25%"
echo ""

# 确认是否已执行SQL
echo "❓ 请确认已在Supabase执行以下SQL脚本："
echo "   1. 🔍检查收益分配表是否存在.sql"
echo "   2. 🔧创建收益分配记录表.sql（如需要）"
echo "   3. 🔧更新收益分配字段.sql（如需要）"
echo "   4. 🔧修改二级销售默认佣金率为25%.sql"
echo ""
read -p "是否已执行所有必要的SQL脚本？(y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 请先执行SQL脚本后再运行部署"
    exit 1
fi

# 提交代码
echo ""
echo "📦 提交代码..."
git add .
git commit -m "feat(v2.7.0+v2.8.0): 综合优化和资金统计增强

v2.7.0 综合优化：
- 修复订单重复计算问题（使用Map按order_number去重）
- 优化待返佣状态逻辑（已返=应返时显示已结清）
- 改进收款地址显示（缩短地址，增大复制按钮）
- 购买页面TRC20改为ERC20
- 二级销售对账页面响应式优化
- 添加用户购买链接功能
- 修复二级销售默认佣金率为25%

v2.8.0 资金统计增强：
- 7天免费订单不计入待付款确认统计
- 7天免费订单直接计入待配置确认统计
- 资金统计新增总实付金额列
- 分配金额基于总实付金额计算（原为营利金额）
- 公户下添加营销(10%)、分红(15%)、开发费用(15%)子项

影响页面：
- 管理员仪表板、资金统计、销售管理
- 订单管理、二级销售对账、一级销售结算
- 各注册页面、购买页面

数据库更新：
- profit_distributions表结构更新
- secondary_sales默认佣金率改为25%"

# 推送代码
echo ""
echo "📤 推送到远程仓库..."
git push

echo ""
echo "✅ 代码已推送，Vercel将自动部署"
echo ""
echo "📊 部署信息："
echo "- 预计部署时间：3-5分钟"
echo "- 生产环境：https://zhixing-seven.vercel.app"
echo ""
echo "🔍 验证链接："
echo "- 管理员仪表板：https://zhixing-seven.vercel.app/admin/dashboard"
echo "- 资金统计：https://zhixing-seven.vercel.app/admin/finance"
echo "- 销售管理：https://zhixing-seven.vercel.app/admin/sales"
echo "- 订单管理：https://zhixing-seven.vercel.app/admin/orders"
echo "- 二级销售对账：https://zhixing-seven.vercel.app/sales-reconciliation"
echo ""
echo "📋 重点测试项："
echo ""
echo "【订单统计】"
echo "✓ 创建7天免费订单，验证不在待付款确认统计"
echo "✓ 验证7天免费订单在待配置确认统计"
echo "✓ 检查WML792355703的订单统计无重复"
echo ""
echo "【资金统计】"
echo "✓ 检查总实付金额列显示"
echo "✓ 验证公户下的营销、分红、开发费用子项"
echo "✓ 确认分配金额基于总实付金额计算"
echo ""
echo "【销售管理】"
echo "✓ 验证fl261247的待返佣状态"
echo "✓ 测试收款地址复制功能"
echo "✓ 检查二级销售默认佣金率为25%"
echo ""
echo "【响应式布局】"
echo "✓ 手机端测试二级销售对账页面"
echo "✓ 验证用户购买链接功能"
echo ""
echo "================================================"
echo "🎉 部署脚本执行完成！"
echo "请等待Vercel部署完成后进行测试验证"
