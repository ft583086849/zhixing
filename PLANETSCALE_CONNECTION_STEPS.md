# 🔐 获取PlanetScale连接信息详细步骤

## 📋 **第一步：登录PlanetScale**

1. 打开浏览器访问：[https://app.planetscale.com](https://app.planetscale.com)
2. 使用你的账户登录（GitHub账户登录或邮箱登录）

## 🗄️ **第二步：创建或选择数据库**

### 如果没有数据库，先创建：
1. 点击 **"New database"** 按钮
2. 填写信息：
   ```
   Database name: zhixing-treasury
   Region: ap-southeast-1 (Singapore) 或选择离你最近的
   Plan: Hobby (免费)
   ```
3. 点击 **"Create database"**

### 如果已有数据库：
1. 在控制台中找到 `zhixing-treasury` 数据库
2. 点击进入数据库详情页

## 🔗 **第三步：获取连接信息**

1. **点击 "Connect" 按钮**（通常在数据库名称旁边）

2. **选择连接方式**：
   - 选择 **"Connect with: Node.js"**
   - 或选择 **"General"** 

3. **复制连接信息**，你会看到类似这样的信息：
   ```
   Host: xxxxxxxxx.connect.psdb.cloud
   Username: xxxxxxxxx  
   Password: pscale_pw_xxxxxxxxxxxxxxxxxxxxxxxxx
   Database: zhixing-treasury
   ```

## 📝 **第四步：准备Vercel环境变量**

将上面获取的信息按以下格式准备：

| Vercel变量名 | 你的值 |
|-------------|--------|
| `DB_HOST` | [复制的Host值] |
| `DB_USER` | [复制的Username值] |
| `DB_PASSWORD` | [复制的Password值] |
| `DB_NAME` | `zhixing-treasury` |

## ⚙️ **第五步：在Vercel中配置**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `zhixing-zeta`
3. 点击 **"Settings"** → **"Environment Variables"**
4. 逐个添加4个环境变量：

### 添加每个变量：
```
点击 "Add" 按钮
Name: DB_HOST
Value: [粘贴你的Host值]
Environment: ✅ Production ✅ Preview ✅ Development
点击 "Save"

重复以上步骤添加其他3个变量...
```

## 🗄️ **第六步：执行数据库初始化（如果是新数据库）**

1. 回到PlanetScale控制台
2. 点击 **"Console"** 标签
3. 确保在 `main` 分支
4. 复制 `PLANETSCALE_SETUP_GUIDE.md` 中的建表SQL并执行

## ✅ **第七步：验证配置**

配置完成后：
1. Vercel会自动重新部署（2-3分钟）
2. 访问：`https://zhixing-zeta.vercel.app/api/health`
3. 检查响应中数据库连接状态

## 🚨 **安全注意事项**

- ❌ **不要**在聊天、邮件或任何地方分享这些连接信息
- ✅ **只在**Vercel环境变量中配置
- ✅ **定期**轮换数据库密码
- ✅ **确保**选择了所有环境（Production, Preview, Development）

---

## 📞 **如果遇到问题**

1. **找不到Connect按钮**：确保数据库状态为Active
2. **连接信息为空**：可能需要创建新的数据库密码
3. **Vercel部署失败**：检查变量名拼写是否正确 