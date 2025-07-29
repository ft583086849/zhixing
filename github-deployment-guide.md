# GitHub 部署指南 - 支付管理系统

## 🎯 概述

本指南将帮助您通过 GitHub 和免费托管服务部署支付管理系统，无需自己管理服务器。

## 🚀 推荐的免费部署平台

### 1. **Vercel** (推荐)
- ✅ 完全免费
- ✅ 自动部署
- ✅ 支持 React 应用
- ✅ 自动 HTTPS
- ✅ 全球 CDN

### 2. **Netlify**
- ✅ 免费计划
- ✅ 自动部署
- ✅ 支持静态网站
- ✅ 自动 HTTPS

### 3. **Railway**
- ✅ 免费计划
- ✅ 支持 Node.js
- ✅ 自动部署
- ✅ 数据库支持

## 📋 部署步骤

### 第一步：准备 GitHub 仓库

1. **创建 GitHub 仓库**
   ```bash
   # 在 GitHub 上创建新仓库
   # 仓库名：payment-management-system
   # 设为公开仓库
   ```

2. **上传代码到 GitHub**
   ```bash
   # 初始化 Git 仓库
   git init
   git add .
   git commit -m "Initial commit: 支付管理系统"
   git branch -M main
   git remote add origin https://github.com/你的用户名/payment-management-system.git
   git push -u origin main
   ```

### 第二步：Vercel 部署 (前端)

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 选择 "payment-management-system"

3. **配置部署设置**
   ```json
   {
     "buildCommand": "cd client && npm install && npm run build",
     "outputDirectory": "client/build",
     "installCommand": "npm install",
     "framework": "create-react-app"
   }
   ```

4. **环境变量配置**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

### 第三步：Railway 部署 (后端)

1. **访问 Railway**
   - 打开 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置部署设置**
   ```json
   {
     "buildCommand": "cd server && npm install",
     "startCommand": "cd server && npm start",
     "rootDirectory": "server"
   }
   ```

4. **环境变量配置**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your_super_secure_jwt_secret_key
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

### 第四步：数据库配置

1. **使用 Railway 数据库**
   - 在 Railway 项目中添加 PostgreSQL 服务
   - 获取数据库连接信息

2. **更新数据库配置**
   ```javascript
   // server/config/database.js
   const { Sequelize } = require('sequelize');
   
   const sequelize = new Sequelize(process.env.DATABASE_URL, {
     dialect: 'postgres',
     dialectOptions: {
       ssl: {
         require: true,
         rejectUnauthorized: false
       }
     }
   });
   ```

## 🔧 部署配置文件

### Vercel 配置 (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Railway 配置 (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 📝 详细步骤指南

### 1. GitHub 仓库设置

```bash
# 1. 创建 .gitignore 文件
cat > .gitignore << EOF
node_modules/
.env
.env.local
.env.production
.DS_Store
*.log
logs/
uploads/
backups/
EOF

# 2. 提交代码
git add .
git commit -m "准备部署到 GitHub"
git push origin main
```

### 2. Vercel 前端部署

1. **访问 Vercel Dashboard**
2. **点击 "New Project"**
3. **选择你的 GitHub 仓库**
4. **配置构建设置**：
   - Framework Preset: Create React App
   - Root Directory: client
   - Build Command: `npm run build`
   - Output Directory: build
   - Install Command: `npm install`

5. **添加环境变量**：
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

6. **点击 "Deploy"**

### 3. Railway 后端部署

1. **访问 Railway Dashboard**
2. **点击 "New Project"**
3. **选择 "Deploy from GitHub repo"**
4. **选择你的仓库**
5. **配置服务**：
   - Root Directory: server
   - Build Command: `npm install`
   - Start Command: `npm start`

6. **添加环境变量**：
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your_super_secure_jwt_secret_key
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   DATABASE_URL=postgresql://...
   ```

7. **添加 PostgreSQL 数据库**：
   - 点击 "New Service"
   - 选择 "Database" → "PostgreSQL"
   - 复制数据库 URL 到环境变量

### 4. 数据库迁移

```bash
# 在 Railway 控制台中运行
cd server
node scripts/migrate.js
```

## 🔗 域名配置

### 自定义域名 (可选)

1. **Vercel 域名配置**
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录

2. **Railway 域名配置**
   - Railway 会自动提供 HTTPS 域名
   - 可以配置自定义域名

## 📊 监控和维护

### 1. 自动部署
- 每次推送到 GitHub main 分支会自动触发部署
- Vercel 和 Railway 都会自动构建和部署

### 2. 日志查看
- **Vercel**: 在项目 Dashboard 中查看部署日志
- **Railway**: 在服务详情中查看实时日志

### 3. 性能监控
- **Vercel Analytics**: 免费的性能监控
- **Railway Metrics**: 服务性能指标

## 🚨 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 检查 package.json 中的脚本
   # 确保所有依赖都已安装
   npm install
   ```

2. **环境变量问题**
   - 检查 Vercel 和 Railway 中的环境变量配置
   - 确保变量名和值正确

3. **数据库连接失败**
   - 检查 DATABASE_URL 环境变量
   - 确保数据库服务已启动

4. **CORS 错误**
   - 更新 CORS_ORIGIN 环境变量
   - 确保前端 URL 正确

## 💰 成本估算

### 免费计划限制

**Vercel (前端)**:
- ✅ 无限部署
- ✅ 100GB 带宽/月
- ✅ 自动 HTTPS
- ✅ 全球 CDN

**Railway (后端)**:
- ✅ $5 免费额度/月
- ✅ 足够小型项目使用
- ✅ 自动扩展

**总成本**: 基本免费，超出免费额度后按使用量计费

## 🎉 部署完成检查清单

- [ ] GitHub 仓库创建并上传代码
- [ ] Vercel 前端部署成功
- [ ] Railway 后端部署成功
- [ ] 数据库连接正常
- [ ] 环境变量配置正确
- [ ] API 接口测试通过
- [ ] 前端页面正常访问
- [ ] 文件上传功能正常
- [ ] 用户注册登录正常

## 📞 技术支持

### 官方文档
- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app)
- [GitHub 文档](https://docs.github.com)

### 社区支持
- Vercel Discord
- Railway Discord
- GitHub Community

---

**注意**: 这个部署方案完全免费，适合个人项目和小型应用。如果项目规模扩大，可以考虑升级到付费计划。 