# Context7 MCP Enhanced

一个增强版的Context7 MCP服务器，为W项目提供智能代码记忆管理和模式学习功能。

## 功能特性

### 🧠 智能记忆管理
- 自动记忆代码模式和最佳实践
- 基于上下文的记忆检索
- 记忆导入/导出功能
- 自动清理过期记忆

### 📊 代码模式分析
- 自动识别React组件模式
- 检测代码风格和命名约定
- 分析项目架构模式
- 生成代码建议

### 🔍 代码库索引
- 实时文件索引和更新
- 依赖关系分析
- 快速代码搜索
- 文件关系图生成

### 📝 上下文构建
- 智能上下文感知
- 相关文件自动发现
- 导入/导出分析
- 代码使用追踪

## 安装和配置

### 1. 安装依赖

```bash
cd context7-mcp-enhanced
npm install
```

### 2. MCP配置已自动添加

配置文件 `.mcp.json` 已包含 context7-enhanced 服务器：

```json
{
  "context7-enhanced": {
    "command": "node",
    "args": [
      "/Users/zzj/Documents/w/context7-mcp-enhanced/src/index.js"
    ],
    "env": {
      "PROJECT_ROOT": "/Users/zzj/Documents/w",
      "NODE_ENV": "production"
    }
  }
}
```

### 3. 重启Cursor

重启Cursor编辑器以加载新的MCP服务器。

## 使用方法

### 学习代码模式

```
工具: learn_patterns
参数: {
  "path": "client/src/components",
  "type": "directory"
}
```

### 获取上下文

```
工具: get_context
参数: {
  "file": "client/src/App.js",
  "line": 10,
  "type": "full"
}
```

### 记忆存储

```
工具: remember
参数: {
  "key": "api_pattern",
  "value": {
    "pattern": "async/await with error handling",
    "example": "..."
  },
  "type": "pattern"
}
```

### 记忆检索

```
工具: recall
参数: {
  "key": "api_pattern",
  "fuzzy": false
}
```

### 分析文件

```
工具: analyze_file
参数: {
  "file": "client/src/services/api.js"
}
```

### 代码建议

```
工具: suggest_code
参数: {
  "context": "Creating a new React component",
  "intent": "component"
}
```

### 索引代码库

```
工具: index_codebase
参数: {
  "full": true
}
```

### 搜索模式

```
工具: search_patterns
参数: {
  "query": "useState",
  "type": "pattern"
}
```

## 项目结构

```
context7-mcp-enhanced/
├── src/
│   ├── index.js              # MCP服务器主入口
│   ├── core/
│   │   ├── CodebaseIndexer.js   # 代码库索引
│   │   ├── ContextBuilder.js    # 上下文构建
│   │   └── FileWatcher.js       # 文件监视
│   ├── memory/
│   │   └── MemoryManager.js     # 记忆管理
│   └── patterns/
│       └── PatternAnalyzer.js   # 模式分析
├── test/                      # 测试文件
├── package.json              # 项目配置
└── README.md                 # 本文档
```

## 工作原理

### 1. 初始化阶段
- 加载项目文件
- 建立初始索引
- 分析代码模式
- 加载历史记忆

### 2. 运行阶段
- 监听文件变化
- 实时更新索引
- 响应工具调用
- 管理记忆存储

### 3. 学习阶段
- 分析代码结构
- 识别设计模式
- 提取最佳实践
- 生成代码建议

## 记忆类型

### Pattern（模式）
存储代码模式和最佳实践：
- 组件模式
- 函数模式
- 架构模式

### Context（上下文）
存储特定上下文信息：
- 文件关系
- 依赖链
- 使用场景

### Learning（学习）
存储学习到的知识：
- 代码风格
- 命名约定
- 项目惯例

## 高级功能

### 记忆导出
导出所有记忆用于备份或分享：

```javascript
const exportPath = await memoryManager.export();
```

### 记忆导入
从导出文件恢复记忆：

```javascript
await memoryManager.import(exportPath);
```

### 自动清理
自动清理30天未使用的记忆：

```javascript
await memoryManager.cleanup();
```

## 性能优化

- 使用缓存减少文件读取
- 防抖处理文件变化
- 增量索引更新
- 智能记忆淘汰

## 故障排除

### 服务器无法启动
1. 检查Node.js版本 >= 18.0.0
2. 确认依赖已安装
3. 验证文件路径正确

### 记忆无法保存
1. 检查 `.context7-memory` 目录权限
2. 确认磁盘空间充足

### 索引速度慢
1. 检查 `.gitignore` 配置
2. 排除不必要的目录
3. 使用增量索引

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-01-14)
- 初始版本发布
- 实现核心功能
- 集成到W项目

## 联系方式

如有问题或建议，请在项目中创建Issue。