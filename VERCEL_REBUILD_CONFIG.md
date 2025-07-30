# 🚀 Vercel重建项目配置参考

## 📋 **环境变量配置清单**

### **💾 核心数据库变量（必需配置）**

```bash
# 在Vercel Environment Variables中添加以下4个变量：

变量名: DB_HOST
值: [你的PlanetScale主机地址，例如: aws.connect.psdb.cloud]
环境: Production, Preview, Development

变量名: DB_USER  
值: [你的PlanetScale用户名]
环境: Production, Preview, Development

变量名: DB_PASSWORD
值: [你的PlanetScale密码，格式: pscale_pw_xxxxx]
环境: Production, Preview, Development

变量名: DB_NAME
值: zhixing-treasury
环境: Production, Preview, Development
```

### **⚙️ 系统配置变量（可选，已在vercel.json中）**

```bash
变量名: NODE_ENV
值: production
环境: Production

变量名: JWT_EXPIRES_IN  
值: 24h
环境: Production, Preview, Development

变量名: CORS_ORIGIN
值: https://zhixing-zeta.vercel.app
环境: Production
```

---

## 🗄️ **如何获取PlanetScale连接信息**

### **方法1：如果已有数据库**
1. 登录 [app.planetscale.com](https://app.planetscale.com)
2. 找到 `zhixing-treasury` 数据库
3. 点击 **"Connect"** → **"Node.js"**
4. 复制连接参数到上述环境变量

### **方法2：如果需要新建数据库**
1. 在PlanetScale创建新数据库：`zhixing-treasury`
2. 选择地区：`ap-southeast-1 (Singapore)`
3. 执行建表SQL（见 PLANETSCALE_SETUP_GUIDE.md）
4. 获取连接信息

---

## 🔧 **Vercel项目重建步骤**

### **步骤1：删除旧项目（可选）**
- 在Vercel Dashboard删除现有的 `zhixing-zeta` 项目

### **步骤2：重新导入**
1. 点击 **"New Project"**
2. 选择 **"Import Git Repository"**
3. 选择GitHub仓库：`ft583086849/zhixing`
4. 分支：`main`

### **步骤3：配置构建设置**
```bash
Framework Preset: Other
Root Directory: ./
Build Command: (自动检测)
Install Command: (自动检测)
Output Directory: (自动检测)
```

### **步骤4：添加环境变量**
- 在部署前点击 **"Environment Variables"**
- 添加上述**核心数据库变量**
- 点击 **"Deploy"**

---

## ✅ **验证部署成功**

部署完成后测试以下端点：

```bash
# 1. 健康检查（应显示 version: "2.1.0" 和数据库连接状态）
https://zhixing-zeta.vercel.app/api/health

# 2. 环境变量调试（应返回JSON格式，hasDbConfig: true）  
https://zhixing-zeta.vercel.app/api/debug-env

# 3. 根路径（应正常显示前端页面）
https://zhixing-zeta.vercel.app/
```

---

## 🚨 **重要提醒**

- ✅ 使用 `DB_*` 变量名（不是 `DATABASE_*`）
- ✅ 所有环境变量都要选择 Production 环境
- ✅ PlanetScale连接信息要完全正确
- ✅ 确保数据库已执行建表SQL

---

**部署成功后，数据库连接问题将彻底解决！** 🎉 