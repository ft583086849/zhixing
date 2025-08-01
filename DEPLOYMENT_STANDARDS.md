# Vercel Serverless API 部署标准

## 🚨 **重要说明**
- **唯一部署平台**: 本项目仅使用 Vercel 进行部署
- **禁止使用**: Railway、Render、Heroku 等其他平台
- **部署方式**: 通过 GitHub 推送自动触发 Vercel 部署
- **项目地址**: https://zhixing-seven.vercel.app

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

### 部署检查
- [ ] 确认使用 Vercel 部署
- [ ] 删除 Railway/Render 配置文件
- [ ] 验证 GitHub 推送触发 Vercel 部署
- [ ] 确认环境变量在 Vercel 中正确配置 