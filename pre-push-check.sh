#!/bin/bash

# 推送前检查脚本
# 在推送前自动检查所有API文件是否符合部署标准

echo "🚀 开始推送前检查..."
echo "=================================="

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 检测到未提交的更改:"
    git status --short
    echo ""
    
    # 询问是否继续
    read -p "是否继续检查？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 检查已取消"
        exit 1
    fi
else
    echo "✅ 没有未提交的更改"
fi

# 运行部署标准检查
echo ""
echo "🔍 运行部署标准检查..."
node check-deployment-standards.js
check_result=$?

if [ $check_result -eq 0 ]; then
    echo ""
    echo "✅ 所有文件都符合部署标准！"
    echo ""
    
    # 显示将要推送的内容
    echo "📤 将要推送的内容:"
    git log --oneline -5
    echo ""
    
    # 询问是否继续推送
    read -p "是否继续推送？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 开始推送..."
        git push
        if [ $? -eq 0 ]; then
            echo "✅ 推送成功！"
        else
            echo "❌ 推送失败！"
            exit 1
        fi
    else
        echo "❌ 推送已取消"
        exit 1
    fi
else
    echo ""
    echo "❌ 有文件不符合部署标准，请修复后再推送！"
    echo ""
    echo "💡 修复建议:"
    echo "  1. 检查语法错误"
    echo "  2. 确保文件结构完整"
    echo "  3. 验证CORS设置"
    echo "  4. 检查错误处理"
    echo "  5. 确认数据库连接管理"
    echo ""
    exit 1
fi 