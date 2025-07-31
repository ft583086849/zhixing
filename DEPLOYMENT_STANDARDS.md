# Vercel Serverless API 部署标准

## 📋 文件结构标准

### 1. 文件头部注释
```javascript
// Vercel Serverless Function - [功能名称]API
```

### 2. 依赖导入
```javascript
const mysql = require('mysql2/promise');
// 其他必要的依赖...
```

### 3. 数据库配置
```javascript
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};
```

### 4. CORS设置
```javascript
// 设置CORS头部
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
```

### 5. OPTIONS处理
```javascript
// 处理OPTIONS预检请求
if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

### 6. 错误处理
```javascript
try {
  // 主要逻辑
} catch (error) {
  console.error('[API名称]错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
}
```

### 7. 数据库连接管理
```javascript
const connection = await mysql.createConnection(dbConfig);
// 使用连接...
await connection.end();
```

### 8. 路径处理
```javascript
const { path } = req.query;
if (req.method === 'POST' && path === 'create') {
  // 处理逻辑
} else {
  res.status(404).json({
    success: false,
    message: `路径不存在: ${req.method} ${path || 'default'}`
  });
}
```

### 9. 响应格式
```javascript
res.json({
  success: true,
  message: '操作成功',
  data: result
});
```

## 🔍 检查清单

### 语法检查
- [ ] 文件语法正确 (node -c)
- [ ] 无语法错误

### 结构检查
- [ ] 文件头部注释正确
- [ ] 依赖导入完整
- [ ] 数据库配置完整
- [ ] CORS设置完整
- [ ] OPTIONS处理存在
- [ ] 错误处理完整
- [ ] 数据库连接管理正确
- [ ] 路径处理逻辑存在
- [ ] 响应格式统一

### 文件检查
- [ ] 文件权限正确 (644)
- [ ] 文件大小合理
- [ ] 文件编码正确

## ❌ 常见问题

### 推送失败原因
1. **语法错误** - 文件有JavaScript语法错误
2. **结构不完整** - 缺少必要的组件
3. **CORS设置错误** - 头部设置不完整
4. **数据库连接错误** - 配置或连接管理问题
5. **错误处理缺失** - 没有try-catch包装
6. **文件权限问题** - 文件权限不正确

### 成功推送特征
1. **结构完整** - 包含所有必要组件
2. **错误处理** - 完整的错误处理机制
3. **标准格式** - 统一的代码格式
4. **权限正确** - 文件权限为644
5. **语法正确** - 无语法错误 