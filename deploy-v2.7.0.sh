#!/bin/bash

echo "🚀 开始部署 v2.7.0 - 综合优化更新"
echo "================================================"
echo ""
echo "📝 更新内容："
echo "1. ✅ 修复订单重复计算问题"
echo "2. ✅ 优化待返佣状态逻辑"
echo "3. ✅ 改进收款地址显示和复制按钮"
echo "4. ✅ 二级销售页面添加购买链接"
echo "5. ✅ 添加响应式布局优化"
echo "6. ✅ 修复二级销售默认佣金率为25%"
echo ""

# 提交代码
echo "📦 提交代码..."
git add .
git commit -m "feat(v2.7.0): 综合优化更新

修复和优化：
- 修复订单重复计算问题（使用Map去重）
- 优化待返佣状态逻辑
- 改进收款地址显示（缩短地址，增大复制按钮）
- 二级销售页面添加用户购买链接
- 响应式布局优化
- 修复二级销售默认佣金率为25%（原为30%）

影响页面：
- 销售管理页面
- 二级销售对账页面
- 一级销售结算页面

注意：需要在Supabase执行SQL脚本修改数据库默认值"

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
echo "- 销售管理：https://zhixing-seven.vercel.app/admin/sales"
echo "- 二级销售对账：https://zhixing-seven.vercel.app/sales-reconciliation"
echo "- 一级销售结算：https://zhixing-seven.vercel.app/primary-sales-settlement"
echo ""
echo "📋 测试要点："
echo "1. 检查WML792355703的订单统计是否正确"
echo "2. 验证fl261247的待返佣状态"
echo "3. 测试收款地址复制功能"
echo "4. 查看二级销售页面的购买链接"
echo "5. 在手机端测试响应式布局"
echo "6. 验证waterli_1313的佣金率是否为25%"
echo "7. 创建新二级销售时默认佣金率是否为25%"
echo ""
echo "================================================"
echo "部署启动完成！"
