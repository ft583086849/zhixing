# 🧹 Vercel 环境变量清理指南

## 📋 **当前环境变量状态分析**

根据代码配置，以下是需要的环境变量清单：

### ✅ **需要保留的变量**（在vercel.json中已配置）
```
NODE_ENV=production          ✅ 保留 - 切换生产环境模式
JWT_EXPIRES_IN=24h          ✅ 保留 - JWT过期时间
CORS_ORIGIN=https://zhixing-zeta.vercel.app  ✅ 保留 - 跨域配置
```

### 🆕 **需要新增的PlanetScale变量**
```
DB_HOST=[你的PlanetScale主机]      🆕 新增
DB_USER=[你的PlanetScale用户名]    🆕 新增  
DB_PASSWORD=[你的PlanetScale密码]  🆕 新增
DB_NAME=zhixing-treasury          🆕 新增
```

### ❌ **可能需要删除的旧变量**（如果存在）

检查Vercel控制台是否有以下旧的数据库变量，**如果有请删除**：

```
DATABASE_HOST     ❌ 删除 - 旧的变量名
DATABASE_USER     ❌ 删除 - 旧的变量名  
DATABASE_PASSWORD ❌ 删除 - 旧的变量名
DATABASE_NAME     ❌ 删除 - 旧的变量名
DATABASE_URL      ❌ 删除 - 不是我们使用的格式
DB_TYPE          ❌ 删除 - 已移除此配置
MYSQL_*          ❌ 删除 - 如果有MySQL相关的旧变量
```

## 🎯 **操作步骤**

### 第一步：检查现有变量
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `zhixing-zeta`
3. Settings → Environment Variables
4. 查看当前所有变量

### 第二步：删除旧的数据库变量
如果发现以下任何变量，请**逐个删除**：
- 任何以 `DATABASE_` 开头的变量
- 任何以 `MYSQL_` 开头的变量  
- `DB_TYPE` 变量
- `DATABASE_URL` 变量

**删除方法**：点击变量右侧的 "..." → Delete

### 第三步：添加新的PlanetScale变量
按照 `PLANETSCALE_CONNECTION_STEPS.md` 指南添加4个新变量：
- `DB_HOST`
- `DB_USER`  
- `DB_PASSWORD`
- `DB_NAME`

### 第四步：验证最终配置
完成后，环境变量应该包含：
```
✅ NODE_ENV=production
✅ JWT_EXPIRES_IN=24h
✅ CORS_ORIGIN=https://zhixing-zeta.vercel.app
✅ DB_HOST=[PlanetScale主机]
✅ DB_USER=[PlanetScale用户名]
✅ DB_PASSWORD=[PlanetScale密码] 
✅ DB_NAME=zhixing-treasury
```

## ⚠️ **特别注意**

1. **不要删除** `NODE_ENV`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` - 这些是必需的
2. **确保删除** 所有旧的数据库变量，避免冲突
3. **Environment选择** 添加新变量时选择：Production + Preview + Development
4. **保存后等待** Vercel会自动重新部署（2-3分钟）

## 🔍 **如何判断是否有旧变量**

如果你在Vercel环境变量页面看到：
- ❌ 超过7个环境变量
- ❌ 任何包含 "DATABASE" 或 "MYSQL" 的变量名
- ❌ 多个不同格式的数据库连接变量

那就说明有旧变量需要清理。

---
**目标**: 最终只保留7个环境变量（3个现有 + 4个PlanetScale） 