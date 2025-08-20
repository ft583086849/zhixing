# 生产环境部署计划 - 订单管理系统优化

## 📋 部署内容清单

### 1. 数据库变更
- 创建 `orders_optimized` 表（67个字段，30+索引）
- 添加佣金拆分字段
- 数据同步（orders → orders_optimized）
- 创建自动同步触发器

### 2. 前端变更
- `/client/src/components/admin/AdminOrders.js` - UI优化
- `/client/src/services/api.js` - 表名切换
- `/routes/orders.js` - 后端API更新

### 3. 备份文件
已创建的备份文件（用于回滚）：
- `client/src/components/admin/AdminOrders.js.backup`
- `client/src/services/api.js.backup`
- `routes/orders.js.backup`

## 🚀 部署步骤

### 第一步：数据库准备（Supabase Dashboard执行）

```sql
-- 1. 创建orders_optimized表
-- 执行文件: create-orders-optimized-table.sql

-- 2. 同步现有数据
-- 执行文件: sync-orders-to-optimized.sql

-- 3. 创建自动同步触发器
-- 执行文件: create-auto-sync-trigger.sql

-- 4. 验证数据
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM orders_optimized;
```

### 第二步：部署前端代码

1. **提交代码到Git**
```bash
git add .
git commit -m "feat: 优化订单管理系统性能和UI"
git push origin main
```

2. **部署到生产环境**
```bash
npm run build
npm run deploy
```

## 🔄 回滚方案

### 快速回滚脚本

创建回滚脚本 `rollback-orders.js`：