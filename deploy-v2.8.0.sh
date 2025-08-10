#!/bin/bash

echo "🚀 开始部署 v2.8.0 - 统计优化和文档更新"
echo "================================================"
echo ""
echo "📝 更新内容："
echo "1. ✅ 7天免费订单不计入待付款确认统计"
echo "2. ✅ 7天免费订单计入待配置确认统计"
echo "3. ✅ 更新佣金率文档（30%→25%）"
echo "4. ✅ 资金统计新增总实付金额列"
echo "5. ✅ 分配金额按总实付金额计算"
echo "6. ✅ 公户下添加营销、分红、开发费用子项"
echo ""
echo "⚠️ 提醒："
echo "- 需要先在 Supabase 执行三个 SQL 脚本"
echo "- 分配金额现在基于总实付金额而非营利金额"
echo ""

# 提交代码
echo "📦 提交代码..."
git add .
git commit -m "feat(v2.8.0): 资金统计增强和订单统计优化

主要更新：
- 7天免费订单不计入待付款确认订单统计
- 资金统计新增总实付金额列
- 分配金额改为基于总实付金额计算（原为营利金额）
- 公户下添加营销、分红、开发费用子项
- 更新文档中的二级销售默认佣金率为25%

影响功能：
- 管理员仪表板统计数据
- 资金统计页面收益分配
- 订单统计逻辑

注意：需要在Supabase执行3个SQL脚本"

# 推送代码
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
echo "- 订单管理：https://zhixing-seven.vercel.app/admin/orders"
echo "- 资金统计：https://zhixing-seven.vercel.app/admin/finance"
echo ""
echo "📋 测试要点："
echo "1. 创建7天免费订单，验证不在待付款确认中"
echo "2. 验证7天免费订单在待配置确认中"
echo "3. 检查资金统计页面总实付金额列"
echo "4. 验证公户下的营销、分红、开发费用子项"
echo "5. 确认分配金额基于总实付金额计算"
echo "6. 检查二级销售默认佣金率为25%"
echo ""
echo "================================================"
echo "部署启动完成！"
