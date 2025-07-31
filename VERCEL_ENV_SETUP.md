# 🚀 Vercel 环境变量配置指南

## 📋 **配置步骤**

### 1. **登录 Vercel Dashboard**
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到并点击项目 `zhixing-zeta`

### 2. **进入环境变量设置**
1. 点击 **"Settings"** 标签页
2. 在侧边栏选择 **"Environment Variables"**

### 3. **添加 PlanetScale 环境变量**

按照以下顺序添加 4 个环境变量：

| 序号 | 变量名 | 示例值 | 说明 |
|------|--------|--------|------|
| 1 | `DB_HOST` | `xxxxx.connect.psdb.cloud` | PlanetScale主机地址 |
| 2 | `DB_USER` | `xxxxx` | 数据库用户名 |
| 3 | `DB_PASSWORD` | `pscale_pw_xxxxx` | 数据库密码 |
| 4 | `DB_NAME` | `zhixing` | 数据库名称 |

### 4. **获取 PlanetScale 连接信息**

如果你还没有PlanetScale数据库，请按以下步骤操作：

1. **访问 PlanetScale**
   - 打开 [app.planetscale.com](https://app.planetscale.com)
   - 登录或注册账户

2. **创建数据库**
   ```
   Database name: zhixing-treasury
   Region: ap-southeast-1 (Singapore)
   ```

3. **获取连接信息**
   - 点击 **"Connect"** 按钮
   - 选择 **"Connect with: Node.js"**
   - 复制连接参数

4. **执行建表SQL**
   - 在 **"Console"** 中执行 `PLANETSCALE_SETUP_GUIDE.md` 中的SQL

### 5. **配置环境变量**

在 Vercel 环境变量页面，逐个添加：

```bash
# 点击 "Add" 按钮
Name: DB_HOST
Value: [你的PlanetScale主机地址]
Environment: Production, Preview, Development

# 重复添加其他变量...
```

### 6. **验证部署**

配置完成后：
1. Vercel 会自动触发重新部署
2. 等待 2-3 分钟部署完成
3. 访问 `https://zhixing-zeta.vercel.app/api/health`
4. 检查响应中是否显示数据库连接成功

## ✅ **验证清单**

- [ ] 已创建 PlanetScale 数据库
- [ ] 已执行建表 SQL
- [ ] 已在 Vercel 添加 4 个环境变量
- [ ] 部署已完成
- [ ] 健康检查通过
- [ ] 数据库连接成功

## 🚨 **常见问题**

### Q: 环境变量不生效？
A: 确保环境名称选择了 "Production"，保存后等待重新部署

### Q: 数据库连接失败？
A: 检查连接信息是否正确，确认 PlanetScale 数据库状态

### Q: 重新部署后仍显示 SQLite？
A: 检查 `NODE_ENV=production` 是否在 vercel.json 中正确设置

---
**下一步**: 配置完成后测试所有功能是否正常工作 