#!/bin/bash

# 简化的项目自动记录脚本
PROJECT_NAME=$(basename $(pwd))
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
MEMORY_DIR=".project-memory"
MEMORY_DB="$MEMORY_DIR/memory-db.json"

# 确保记录目录存在
mkdir -p "$MEMORY_DIR"

# 记录对话
record_conversation() {
    echo "[$TIMESTAMP] 对话记录: $1" >> "$MEMORY_DIR/conversations.log"
    echo "对话已记录到 $MEMORY_DIR/conversations.log"
}

# 记录代码变更
record_code_change() {
    echo "[$TIMESTAMP] 代码变更: $1" >> "$MEMORY_DIR/code-changes.log"
    if [ -d ".git" ]; then
        git diff --name-only 2>/dev/null | while read file; do
            echo "  - 修改文件: $file" >> "$MEMORY_DIR/code-changes.log"
        done
    fi
    echo "代码变更已记录到 $MEMORY_DIR/code-changes.log"
}

# 记录项目状态
record_project_status() {
    echo "[$TIMESTAMP] 项目状态记录" >> "$MEMORY_DIR/project-status.log"
    
    # 记录文件结构
    echo "文件结构:" >> "$MEMORY_DIR/project-status.log"
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.java" | head -20 >> "$MEMORY_DIR/project-status.log"
    
    # 记录Git状态
    if [ -d ".git" ]; then
        echo "Git状态:" >> "$MEMORY_DIR/project-status.log"
        git status --porcelain >> "$MEMORY_DIR/project-status.log" 2>/dev/null
    fi
    
    echo "项目状态已记录到 $MEMORY_DIR/project-status.log"
}

# 主函数
case "$1" in
    "conversation")
        record_conversation "$2"
        ;;
    "code-change")
        record_code_change "$2"
        ;;
    "status")
        record_project_status
        ;;
    *)
        echo "用法: $0 {conversation|code-change|status} [描述]"
        echo "示例:"
        echo "  $0 conversation '讨论了用户认证功能'"
        echo "  $0 code-change '添加了登录组件'"
        echo "  $0 status"
        ;;
esac
