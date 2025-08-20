#!/bin/bash

# ========================================
# 全局快捷命令安装脚本
# 让小C、小U、小R、小多等在任何地方都能用
# ========================================

echo "🚀 开始安装全局快捷命令..."

# 1. 创建命令存放目录
mkdir -p ~/bin
echo "✅ 创建 ~/bin 目录"

# 2. 创建小C命令 - 查看Claude使用记录
cat > ~/bin/小C << 'EOF'
#!/bin/bash
echo "📊 查看Claude Code使用记录..."
ccusage
EOF
chmod +x ~/bin/小C

# 3. 创建小多命令 - 运行并行任务
cat > ~/bin/小多 << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "🚀 运行预设任务列表（10个并发）..."
    node ~/Documents/w/auto-run-tasks.js
else
    echo "📋 需要Agent并行处理: $*"
    echo "请在Claude Code中使用完整的'小多'功能"
fi
EOF
chmod +x ~/bin/小多

# 4. 创建小R命令 - 查看规范
cat > ~/bin/小R << 'EOF'
#!/bin/bash
echo "📖 显示CLAUDE.md规范文档..."
cat ~/Documents/w/CLAUDE.md | less
EOF
chmod +x ~/bin/小R

# 5. 创建小U命令 - 深度思考提示
cat > ~/bin/小U << 'EOF'
#!/bin/bash
echo "🤔 小U是深度思考模式"
echo "请在Claude Code对话中使用"
echo "示例：'小U，分析这个问题...'"
EOF
chmod +x ~/bin/小U

# 6. 创建小I命令 - 项目初始化
cat > ~/bin/小I << 'EOF'
#!/bin/bash
echo "🎯 初始化新项目..."
if command -v claude &> /dev/null; then
    claude init
else
    echo "❌ 需要安装Claude CLI"
fi
EOF
chmod +x ~/bin/小I

# 7. 创建小D命令 - 危险模式提示
cat > ~/bin/小D << 'EOF'
#!/bin/bash
echo "⚠️  小D是危险模式 (--dangerously-skip-permission)"
echo "跳过所有权限检查，谨慎使用！"
echo "在Claude Code中使用: 小D"
EOF
chmod +x ~/bin/小D

# 8. 创建统一的'小'命令
cat > ~/bin/小 << 'EOF'
#!/bin/bash
case "$1" in
    C|c)
        小C
        ;;
    多)
        shift
        小多 "$@"
        ;;
    R|r)
        小R
        ;;
    U|u)
        小U
        ;;
    I|i)
        小I
        ;;
    D|d)
        小D
        ;;
    *)
        echo "📚 可用的小命令："
        echo "  小 C  - 查看Claude使用记录"
        echo "  小 多 - 运行并行任务"
        echo "  小 R  - 查看规范文档"
        echo "  小 U  - 深度思考模式（Claude中用）"
        echo "  小 I  - 初始化项目"
        echo "  小 D  - 危险模式（Claude中用）"
        echo ""
        echo "或直接使用：小C, 小多, 小R 等"
        ;;
esac
EOF
chmod +x ~/bin/小

# 9. 添加到PATH（支持多种shell）
echo "📝 配置环境变量..."

# 对于 zsh (Mac默认)
if [ -f ~/.zshrc ]; then
    if ! grep -q "export PATH=\$HOME/bin:\$PATH" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# 小命令快捷方式" >> ~/.zshrc
        echo "export PATH=\$HOME/bin:\$PATH" >> ~/.zshrc
        echo "✅ 已添加到 ~/.zshrc"
    fi
fi

# 对于 bash
if [ -f ~/.bash_profile ]; then
    if ! grep -q "export PATH=\$HOME/bin:\$PATH" ~/.bash_profile; then
        echo "" >> ~/.bash_profile
        echo "# 小命令快捷方式" >> ~/.bash_profile
        echo "export PATH=\$HOME/bin:\$PATH" >> ~/.bash_profile
        echo "✅ 已添加到 ~/.bash_profile"
    fi
fi

# 对于 fish
if [ -f ~/.config/fish/config.fish ]; then
    if ! grep -q "set -gx PATH \$HOME/bin \$PATH" ~/.config/fish/config.fish; then
        echo "" >> ~/.config/fish/config.fish
        echo "# 小命令快捷方式" >> ~/.config/fish/config.fish
        echo "set -gx PATH \$HOME/bin \$PATH" >> ~/.config/fish/config.fish
        echo "✅ 已添加到 fish config"
    fi
fi

echo ""
echo "========================================="
echo "✨ 安装完成！"
echo "========================================="
echo ""
echo "📌 可用命令："
echo "  小C    - 查看Claude使用记录"
echo "  小多   - 运行并行任务"
echo "  小R    - 查看规范文档"
echo "  小U    - 深度思考模式提示"
echo "  小I    - 初始化项目"
echo "  小D    - 危险模式提示"
echo "  小     - 显示所有命令"
echo ""
echo "🔄 激活方法："
echo "  1. 运行: source ~/.zshrc"
echo "  2. 或重新打开终端"
echo ""
echo "🎯 测试命令："
echo "  在任何目录运行: 小C"
echo "========================================="

# 立即激活（尝试）
export PATH=$HOME/bin:$PATH