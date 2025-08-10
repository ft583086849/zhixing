#!/bin/bash

echo "🚀 开始部署 v2.6.0 - 修复 payment_account 字段错误"
echo "================================================"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 检测到未提交的更改，准备提交..."
    
    # 添加修改的文件
    git add client/src/services/api.js
    git add 📋v2.6.0修复payment_account字段错误.md
    git add deploy-v2.6.0.sh
    
    # 提交更改
    git commit -m "fix: 修复二级销售注册 payment_account 字段错误

- 删除 registerPrimary 和 registerSecondary 中的错误映射
- 统一使用 payment_address 字段读取数据
- 解决 Supabase schema cache 报错问题"
    
    echo "✅ 代码已提交"
else
    echo "✅ 没有未提交的更改"
fi

# 推送到远程仓库
echo "📤 推送代码到远程仓库..."
git push

echo "✅ 代码已推送，Vercel 将自动部署"
echo ""
echo "📊 部署状态："
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- 生产环境: https://zhixing-seven.vercel.app"
echo ""
echo "🔍 测试链接："
echo "- 二级销售注册（关联）: https://zhixing-seven.vercel.app/secondary-sales?registration_code=SEC17547229471452369"
echo "- 二级销售注册（独立）: https://zhixing-seven.vercel.app/secondary-sales"
echo "- 销售管理页面: https://zhixing-seven.vercel.app/admin/sales"
echo ""
echo "⏰ 预计部署时间: 3-5分钟"
echo "================================================"
