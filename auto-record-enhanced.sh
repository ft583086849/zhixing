#!/bin/bash

# 增强版项目自动记录脚本
PROJECT_NAME=$(basename $(pwd))
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
MEMORY_DIR=".project-memory"
MEMORY_DB="$MEMORY_DIR/memory-db.json"

# 确保记录目录存在
mkdir -p "$MEMORY_DIR"

# 自动记录对话（从Cursor MCP调用）
auto_record_conversation() {
    local message="$1"
    echo "[$TIMESTAMP] 自动对话记录: $message" >> "$MEMORY_DIR/conversations.log"
    echo "✅ 对话已自动记录"
}

# 自动记录代码变更（从文件监控触发）
auto_record_code_change() {
    local file="$1"
    local change_type="$2"
    echo "[$TIMESTAMP] 自动代码变更: $change_type - $file" >> "$MEMORY_DIR/code-changes.log"
    echo "✅ 代码变更已自动记录: $file"
}

# 自动记录项目状态
auto_record_project_status() {
    echo "[$TIMESTAMP] 自动项目状态记录" >> "$MEMORY_DIR/project-status.log"
    
    # 记录文件结构
    echo "文件结构:" >> "$MEMORY_DIR/project-status.log"
    find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.java" -o -name "*.md" \) | head -20 >> "$MEMORY_DIR/project-status.log"
    
    # 记录Git状态
    if [ -d ".git" ]; then
        echo "Git状态:" >> "$MEMORY_DIR/project-status.log"
        git status --porcelain >> "$MEMORY_DIR/project-status.log" 2>/dev/null
    fi
    
    echo "✅ 项目状态已自动记录"
}

# 智能历史读取功能（小R功能）
read_history() {
    local query="$1"
    echo "🧠 小R智能历史读取: $query"
    echo "===================="
    
    # 读取所有历史记录
    local all_history=""
    
    # 读取对话记录
    if [ -f "$MEMORY_DIR/conversations.log" ]; then
        all_history+="📝 对话历史:\n$(cat "$MEMORY_DIR/conversations.log")\n\n"
    fi
    
    # 读取代码变更记录
    if [ -f "$MEMORY_DIR/code-changes.log" ]; then
        all_history+="💻 代码变更历史:\n$(cat "$MEMORY_DIR/code-changes.log")\n\n"
    fi
    
    # 读取项目状态记录
    if [ -f "$MEMORY_DIR/project-status.log" ]; then
        all_history+="📊 项目状态历史:\n$(cat "$MEMORY_DIR/project-status.log")\n\n"
    fi
    
    # 保存到临时文件供AI读取
    echo -e "$all_history" > "$MEMORY_DIR/temp_history.txt"
    
    echo "✅ 小R已准备好历史记录，AI可以读取了"
    echo "📁 历史文件位置: $MEMORY_DIR/temp_history.txt"
    echo "===================="
}

# 搜索历史记录
search_memory() {
    local query="$1"
    echo "🔍 搜索项目记忆: $query"
    echo "===================="
    
    # 搜索对话记录
    if [ -f "$MEMORY_DIR/conversations.log" ]; then
        echo "📝 对话记录搜索结果:"
        grep -i "$query" "$MEMORY_DIR/conversations.log" | tail -10
        echo ""
    fi
    
    # 搜索代码变更记录
    if [ -f "$MEMORY_DIR/code-changes.log" ]; then
        echo "💻 代码变更搜索结果:"
        grep -i "$query" "$MEMORY_DIR/code-changes.log" | tail -10
        echo ""
    fi
    
    # 搜索项目状态记录
    if [ -f "$MEMORY_DIR/project-status.log" ]; then
        echo "📊 项目状态搜索结果:"
        grep -i "$query" "$MEMORY_DIR/project-status.log" | tail -10
        echo ""
    fi
    
    echo "===================="
    echo "✅ 搜索完成"
}

# 启动文件监控
start_file_monitoring() {
    echo "🚀 启动文件监控..."
    
    # 检查是否安装了fswatch
    if ! command -v fswatch &> /dev/null; then
        echo "⚠️  需要安装fswatch: brew install fswatch"
        return 1
    fi
    
    # 后台启动文件监控
    fswatch -o . | while read f; do
        # 检测文件变化并自动记录
        for file in $(find . -type f -newer "$MEMORY_DIR/last-check" 2>/dev/null | head -5); do
            if [[ "$file" != *".project-memory"* ]]; then
                auto_record_code_change "$file" "修改"
            fi
        done
        touch "$MEMORY_DIR/last-check"
    done &
    
    echo "✅ 文件监控已启动 (PID: $!)"
    echo "$!" > "$MEMORY_DIR/monitor.pid"
}

# 停止文件监控
stop_file_monitoring() {
    if [ -f "$MEMORY_DIR/monitor.pid" ]; then
        local pid=$(cat "$MEMORY_DIR/monitor.pid")
        kill $pid 2>/dev/null
        rm "$MEMORY_DIR/monitor.pid"
        echo "✅ 文件监控已停止"
    fi
}

# 主函数
case "$1" in
    "auto-conversation")
        auto_record_conversation "$2"
        ;;
    "auto-code-change")
        auto_record_code_change "$2" "$3"
        ;;
    "auto-status")
        auto_record_project_status
        ;;
    "read-history")
        read_history "$2"
        ;;
    "search")
        search_memory "$2"
        ;;
    "start-monitor")
        start_file_monitoring
        ;;
    "stop-monitor")
        stop_file_monitoring
        ;;
    "conversation")
        echo "[$TIMESTAMP] 对话记录: $2" >> "$MEMORY_DIR/conversations.log"
        echo "对话已记录到 $MEMORY_DIR/conversations.log"
        ;;
    "code-change")
        echo "[$TIMESTAMP] 代码变更: $2" >> "$MEMORY_DIR/code-changes.log"
        echo "代码变更已记录到 $MEMORY_DIR/code-changes.log"
        ;;
    "status")
        echo "[$TIMESTAMP] 项目状态记录" >> "$MEMORY_DIR/project-status.log"
        echo "项目状态已记录到 $MEMORY_DIR/project-status.log"
        ;;
    *)
        echo "用法: $0 {auto-conversation|auto-code-change|auto-status|read-history|search|start-monitor|stop-monitor|conversation|code-change|status} [参数]"
        echo ""
        echo "自动记录命令:"
        echo "  $0 auto-conversation '消息内容'     # 自动记录对话"
        echo "  $0 auto-code-change '文件' '类型'   # 自动记录代码变更"
        echo "  $0 auto-status                     # 自动记录项目状态"
        echo "  $0 read-history '关键词'           # 小R智能读取历史"
        echo "  $0 search '搜索关键词'              # 搜索历史记录"
        echo "  $0 start-monitor                   # 启动文件监控"
        echo "  $0 stop-monitor                    # 停止文件监控"
        echo ""
        echo "手动记录命令:"
        echo "  $0 conversation '消息内容'          # 手动记录对话"
        echo "  $0 code-change '变更描述'           # 手动记录代码变更"
        echo "  $0 status                          # 手动记录项目状态"
        ;;
esac
