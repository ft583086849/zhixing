#!/bin/bash

echo "🚀 支付管理系统快速部署脚本"
echo "============================"
echo ""

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    echo "macOS: brew install git"
    echo "Ubuntu: sudo apt install git"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "访问: https://nodejs.org"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 获取GitHub用户名
echo "📝 请输入您的GitHub用户名:"
read -r github_username

if [ -z "$github_username" ]; then
    echo "❌ GitHub用户名不能为空"
    exit 1
fi

# 获取仓库名
echo "📝 请输入仓库名 (默认: payment-management-system):"
read -r repo_name
repo_name=${repo_name:-payment-management-system}

echo ""
echo "🔧 开始部署配置..."
echo "GitHub用户名: $github_username"
echo "仓库名: $repo_name"
echo ""

# 检查是否已经初始化Git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: 支付管理系统"
    git branch -M main
    echo "✅ Git仓库初始化完成"
else
    echo "✅ Git仓库已存在"
fi

# 检查远程仓库
if git remote get-url origin &> /dev/null; then
    echo "✅ 远程仓库已配置"
    current_remote=$(git remote get-url origin)
    echo "当前远程仓库: $current_remote"
    
    echo ""
    echo "是否要更新远程仓库地址? (y/n)"
    read -r update_remote
    
    if [[ $update_remote =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/$github_username/$repo_name.git"
        echo "✅ 远程仓库地址已更新"
    fi
else
    echo "🔗 配置远程仓库..."
    git remote add origin "https://github.com/$github_username/$repo_name.git"
    echo "✅ 远程仓库配置完成"
fi

# 推送代码
echo ""
echo "📤 推送代码到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功！"
else
    echo "❌ 代码推送失败"
    echo ""
    echo "请手动执行以下命令："
    echo "git push -u origin main"
    exit 1
fi

echo ""
echo "🎉 本地部署配置完成！"
echo ""
echo "📋 下一步操作："
echo ""
echo "1️⃣ 创建GitHub仓库："
echo "   访问: https://github.com/new"
echo "   仓库名: $repo_name"
echo "   设为公开仓库"
echo "   不要初始化README"
echo ""
echo "2️⃣ 部署前端到Vercel："
echo "   访问: https://vercel.com"
echo "   点击 'New Project'"
echo "   选择你的GitHub仓库"
echo "   配置构建设置："
echo "   - Framework Preset: Create React App"
echo "   - Root Directory: client"
echo "   - Build Command: npm run build"
echo "   - Output Directory: build"
echo ""
echo "3️⃣ 部署后端到Railway："
echo "   访问: https://railway.app"
echo "   点击 'New Project'"
echo "   选择 'Deploy from GitHub repo'"
echo "   选择你的仓库"
echo "   配置服务："
echo "   - Root Directory: server"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""
echo "4️⃣ 配置环境变量："
echo "   在Vercel中设置:"
echo "   REACT_APP_API_URL=https://your-backend-url.railway.app"
echo ""
echo "   在Railway中设置:"
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo "   JWT_SECRET=your_super_secure_jwt_secret_key"
echo "   CORS_ORIGIN=https://your-frontend-url.vercel.app"
echo ""
echo "5️⃣ 添加数据库："
echo "   在Railway项目中添加PostgreSQL服务"
echo "   复制DATABASE_URL到环境变量"
echo ""
echo "📚 详细部署指南："
echo "   查看: github-deployment-guide.md"
echo ""
echo "🔗 您的GitHub仓库地址："
echo "   https://github.com/$github_username/$repo_name"
echo ""
echo "💡 提示："
echo "   - 部署完成后，记得更新vercel.json中的后端URL"
echo "   - 确保所有环境变量都正确配置"
echo "   - 测试所有功能是否正常工作"
echo ""
echo "🎊 祝您部署顺利！" 