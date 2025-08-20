#!/bin/bash

echo "🔧 MCP API配置助手"
echo "=================="
echo ""

# 检查当前配置
echo "📋 当前配置状态："
echo ""

# Ollama
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama: 运行中 (http://localhost:11434)"
    echo "   模型: $(ollama list | tail -n +2 | awk '{print $1}' | tr '\n' ', ' | sed 's/, $//')"
else
    echo "❌ Ollama: 未运行 (运行 'ollama serve' 启动)"
fi
echo ""

# GitHub
if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "✅ GitHub: 已配置 (Token: ${GITHUB_TOKEN:0:10}...)"
else
    echo "❌ GitHub: 未配置"
fi
echo ""

# n8n
if command -v n8n &> /dev/null; then
    echo "✅ n8n: 已安装 (运行 'n8n start' 启动)"
    echo "   访问地址: http://localhost:5678"
else
    echo "⏳ n8n: 安装中... (npm install -g n8n)"
fi
echo ""

# Browserbase
if [ ! -z "$BROWSERBASE_API_KEY" ]; then
    echo "✅ Browserbase: 已配置"
else
    echo "❓ Browserbase: 未配置"
    echo "   如需配置，请添加到 ~/.zshrc:"
    echo "   export BROWSERBASE_API_KEY=\"bb_你的密钥\""
    echo "   export BROWSERBASE_PROJECT_ID=\"proj_你的项目ID\""
fi
echo ""

# Notion
if [ ! -z "$NOTION_API_KEY" ]; then
    echo "✅ Notion: 已配置"
else
    echo "❓ Notion: 未配置 (可选)"
    echo "   如需配置，请添加到 ~/.zshrc:"
    echo "   export NOTION_API_KEY=\"secret_你的密钥\""
fi
echo ""

# Dify
if [ ! -z "$DIFY_API_KEY" ]; then
    echo "✅ Dify: 已配置"
else
    echo "❓ Dify: 未配置 (可选)"
    echo "   如需配置，请添加到 ~/.zshrc:"
    echo "   export DIFY_API_KEY=\"app_你的密钥\""
fi
echo ""

echo "=================="
echo ""
echo "💡 快速命令："
echo ""
echo "1. 启动Ollama: ollama serve"
echo "2. 启动n8n: n8n start"
echo "3. 测试Ollama: ollama run llama3.2:1b \"Hello!\""
echo "4. 编辑配置: code ~/.zshrc"
echo "5. 重载配置: source ~/.zshrc"
echo ""
echo "📚 详细指南: /Users/zzj/Documents/w/API密钥获取指南.md"