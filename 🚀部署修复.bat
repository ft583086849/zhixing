@echo off
REM 🚀 部署修复脚本 (Windows版)
REM 执行方法：双击运行或在命令行运行 🚀部署修复.bat

echo ==========================================
echo 🚀 开始部署修复...
echo ==========================================

REM 1. 添加所有修改
echo 📦 添加所有修改的文件...
git add -A

REM 2. 提交修改
echo 💾 提交到本地仓库...
git commit -m "fix: 修复订单sales_type字段和显示二级销售名字 - 修复11个历史订单的sales_type为NULL问题 - 修复secondary_sales_name字段不存在问题 - 创建orders_with_sales_names视图 - 修改前端使用sales_type判断订单类型 - 一级销售现在能看到具体的二级销售名字 - 修复二级销售创建失败问题"

REM 3. 推送到GitHub
echo 🔄 推送到GitHub...
git push origin main

echo.
echo ==========================================
echo ✅ 部署完成！
echo ==========================================
echo 📌 Vercel将在1-2分钟内自动部署
echo 📌 访问 https://vercel.com 查看部署状态
echo ==========================================
pause
