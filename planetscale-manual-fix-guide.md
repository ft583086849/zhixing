# PlanetScale 数据库字段手动添加指南

## 🎯 目标
添加缺失的数据库字段以完成 `link_code` 到 `sales_code` 的迁移

## 📋 需要执行的SQL语句

```sql
-- 1. 为 primary_sales 表添加 sales_code 字段
ALTER TABLE primary_sales 
ADD COLUMN sales_code VARCHAR(16) UNIQUE 
COMMENT '用户购买时使用的销售代码';

-- 2. 为 primary_sales 表添加 secondary_registration_code 字段
ALTER TABLE primary_sales 
ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE 
COMMENT '二级销售注册时使用的代码';

-- 3. 为 secondary_sales 表添加 sales_code 字段（如果表存在）
ALTER TABLE secondary_sales 
ADD COLUMN sales_code VARCHAR(16) UNIQUE 
COMMENT '用户购买时使用的销售代码';
```

## 🚀 执行步骤

### 方法1：PlanetScale 控制台
1. 登录 [PlanetScale 控制台](https://app.planetscale.com/)
2. 选择 `zhixing` 数据库
3. 点击 "Console" 标签
4. 粘贴上述SQL语句并执行

### 方法2：PlanetScale CLI
```bash
# 安装 PlanetScale CLI
brew install planetscale/tap/pscale

# 登录
pscale auth login

# 连接到数据库
pscale shell zhixing main

# 执行SQL语句
```

### 方法3：通过分支（推荐）
```bash
# 创建新分支
pscale branch create zhixing add-sales-code-fields

# 连接到分支
pscale shell zhixing add-sales-code-fields

# 执行SQL语句
# 测试无误后合并到main
pscale deploy-request create zhixing add-sales-code-fields
```

## ✅ 验证步骤

执行完成后，运行验证脚本：
```bash
node test-database-structure.js
```

## 🎉 完成后的效果

- ✅ 用户购买页面订单创建正常
- ✅ 销售代码统一查找标准
- ✅ 7天免费套餐提交功能
- ✅ 二级销售注册流程
- ✅ 完成 `link_code` 到 `sales_code` 迁移

## 🆘 如果遇到问题

1. **权限不足**：确保您的 PlanetScale 账户有数据库修改权限
2. **字段已存在**：忽略 "Duplicate column" 错误
3. **连接问题**：检查网络和认证状态

## 📞 需要帮助？

如果您在执行过程中遇到任何问题，我可以：
1. 协助调试具体错误
2. 提供替代解决方案
3. 帮助验证修复结果