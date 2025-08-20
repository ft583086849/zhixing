#!/bin/bash

echo "🚀 为W项目安装Context7 MCP..."
echo "===================="

# 检查当前目录
if [ ! -f "package.json" ] && [ ! -f "client/package.json" ]; then
    echo "❌ 请在W项目根目录运行此脚本"
    exit 1
fi

# 更新MCP配置
echo "📝 更新MCP配置..."
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "auto-memory": {
      "command": "node",
      "args": [
        "-e",
        "const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process'); process.stdin.on('data', (data) => { const input = data.toString().trim(); if (input.includes('请记录这次对话') || input.includes('请记录当前状态') || input.includes('请搜索之前的记录') || input.includes('请读取历史') || input.includes('请回顾历史') || input.includes('请查看历史') || input.includes('请读取记忆') || input.includes('请查看记忆') || input.includes('小R') || input.includes('小r')) { try { const projectRoot = process.cwd(); const autoRecordScript = path.join(projectRoot, 'auto-record-enhanced.sh'); if (fs.existsSync(autoRecordScript)) { if (input.includes('对话')) { execSync(\`\"\${autoRecordScript}\" auto-conversation \"\${input}\"\`, { cwd: projectRoot }); } else if (input.includes('状态')) { execSync(\`\"\${autoRecordScript}\" auto-status\`, { cwd: projectRoot }); } else if (input.includes('搜索')) { execSync(\`\"\${autoRecordScript}\" search \"\${input}\"\`, { cwd: projectRoot }); } else if (input.includes('读取') || input.includes('回顾') || input.includes('查看') || input.includes('记忆') || input.includes('小R') || input.includes('小r')) { execSync(\`\"\${autoRecordScript}\" read-history \"\${input}\"\`, { cwd: projectRoot }); } } } catch (error) { console.error('Auto record error:', error.message); } } });"
      ],
      "env": {
        "AUTO_MEMORY_ENABLED": "true",
        "PROJECT_ROOT": "/Users/zzj/Documents/w"
      }
    },
    "graphiti": {
      "command": "npx",
      "args": [
        "-y",
        "graph-memory-mcp-server@latest",
        "--db-name",
        "project-w"
      ],
      "env": {
        "PROJECT_NAME": "w",
        "STORAGE_TYPE": "file",
        "PROJECT_ROOT": "/Users/zzj/Documents/w/.project-memory",
        "AUTO_RECORD_ENABLED": "true"
      }
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@context7/mcp-server"
      ],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}",
        "CONTEXT7_PROJECT_ID": "w-project",
        "AUTO_DOCS": "true"
      }
    }
  }
}
EOF

echo "✅ Context7 MCP配置已添加！"
echo ""
echo "🎯 W项目现在拥有："
echo "1. 小R (auto-memory) - 智能记录和读取"
echo "2. graphiti - 知识图谱管理"
echo "3. context7 - 实时代码文档查询"
echo ""
echo "💡 Context7 MCP功能："
echo "- 实时查询React 18 hooks文档"
echo "- 查询Ant Design组件API"
echo "- 查询Supabase数据库文档"
echo "- 查询Redux Toolkit状态管理"
echo "- 查询其他技术栈文档"
echo ""
echo "🚀 重启Cursor后即可使用Context7功能！"
echo ""
echo "📝 使用示例："
echo "- '查询React useEffect cleanup最佳实践'"
echo "- 'Ant Design Table组件如何实现分页'"
echo "- 'Supabase实时订阅如何配置'"
echo "- 'Redux Toolkit createSlice完整用法'"






