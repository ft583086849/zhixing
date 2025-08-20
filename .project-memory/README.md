# 项目记忆记录 - 文件存储版本

## 概述
项目: w
创建时间: 2025年 8月12日 星期二 21时50分29秒 CST
存储类型: 文件系统存储

## 文件结构
- memory-db.json - 项目记忆数据库
- conversations.log - 对话记录
- code-changes.log - 代码变更记录
- project-status.log - 项目状态记录
- auto-record.sh - 自动记录脚本
- README.md - 使用说明

## 使用方法
1. 在Cursor中使用Graphiti MCP Server
2. 自动记录对话和代码变更
3. 搜索历史记录和知识图谱

## 配置
- 存储类型: 文件系统
- 记录目录: .project-memory/

## 自动记录功能
- 对话记录: 自动记录与Claude的对话
- 代码进程: 自动记录代码编写和修改过程
- 项目状态: 记录项目文件结构和Git状态

## 使用示例
```
请记录这次对话到项目记忆中
请搜索之前的对话记录
请记录当前的代码编写状态
请分析代码变更历史
```

## 手动操作
```bash
# 记录对话
./.project-memory/auto-record.sh conversation '对话内容'

# 记录代码变更
./.project-memory/auto-record.sh code-change '变更描述'

# 记录项目状态
./.project-memory/auto-record.sh status
```
