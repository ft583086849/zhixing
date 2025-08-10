#!/bin/bash

echo "🚀 开始部署链名更新"
echo "================================================"
echo ""
echo "📝 更新内容："
echo "1. 修改链名示例：BSC/TRC20 → BSC（BEP20）、ERC20"
echo "2. 修改购买页面：TRC20 → ERC20"
echo ""

# 提交代码
echo "📦 提交代码..."
git add .
git commit -m "feat: 更新链名示例为BSC(BEP20)和ERC20

- 二级销售注册页面链名示例更新
- 一级销售页面链名示例更新  
- 高阶销售注册页面链名示例更新
- 购买页面TRC20改为ERC20"

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
echo "- 二级销售注册：https://zhixing-seven.vercel.app/secondary-sales?registration_code=SEC17547229471452369"
echo "- 一级销售注册：https://zhixing-seven.vercel.app/primary-sales"
echo "- 高阶销售注册：https://zhixing-seven.vercel.app/sales"
echo "- 购买页面：https://zhixing-seven.vercel.app/purchase?sales_code=PRI17547196352594604"
echo ""
echo "================================================"
echo "部署完成！"
