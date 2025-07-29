# 🔐 PlanetScale 数据库配置

## 📊 数据库状态
- ✅ 连接测试成功
- ✅ 表结构完整 (6个表)
- ✅ 初始数据已插入
- ✅ 权限验证正常

## 🔗 连接信息配置位置

### Vercel环境变量
数据库连接信息已配置在 `vercel.json` 的环境变量中：
- DB_HOST
- DB_NAME  
- DB_USER
- DB_PASSWORD

### 本地开发
本地开发时，请在 `server/env.production` 中配置实际的连接信息。

## 📝 数据库表结构
- **admins**: 管理员账户 (1条记录)
- **sales**: 销售员信息 (0条记录)
- **orders**: 订单记录 (0条记录)
- **payment_config**: 支付配置 (1条记录)
- **lifetime_limit**: 限量配置 (1条记录)
- **system_config**: 系统配置

## 🛡️ 安全说明
- 敏感信息不存储在Git仓库中
- 生产环境使用Vercel环境变量
- 数据库使用SSL连接
- 密码定期更新

---
**✅ 配置完成，准备部署** 