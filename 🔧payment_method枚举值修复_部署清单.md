# Payment Method 枚举值修复 - 部署清单

## 修改文件列表

### 1. `api/primary-sales.js`
**修改内容：**
- 修复payment_method验证逻辑：从`['wechat', 'alipay', 'bank']`改为`['alipay', 'crypto']`
- 更新错误提示信息：改为"收款方式只能是支付宝或线上地址码"

**修复的问题：**
- 一级销售创建时payment_method验证与数据库枚举值不匹配
- 用户收到"Data truncated"错误而不是友好提示

### 2. `api/admin.js`
**修改内容：**
- 更新primary_sales表创建语句：payment_method改为`ENUM('alipay', 'crypto')`
- 更新secondary_sales表创建语句：payment_method改为`ENUM('alipay', 'crypto')`
- 添加payment_method字段修复逻辑：在health API中自动修复现有表结构
- 添加相关字段：payment_address, alipay_surname, chain_name, sales_code等

**修复的问题：**
- 数据库表结构与API验证逻辑不一致
- 缺失必要的收款信息字段

## 预期效果

### 修复前的问题
1. **一级销售创建失败**：显示"创建一级销售失败，请稍后重试"
   - 根本原因：payment_method='wechat'不在数据库ENUM定义中
2. **二级销售注册失败**：显示"注册失败，请稍后重试"
   - 根本原因：表结构与API验证逻辑不匹配

### 修复后的预期效果
1. **一级销售创建成功**：支持alipay和crypto两种收款方式
2. **二级销售注册成功**：独立注册和关联注册都正常工作
3. **统一的收款方式**：
   - `alipay`: 支付宝收款（需要alipay_surname）
   - `crypto`: 线上地址码收款（需要chain_name）

## 验证计划

部署后需要验证：
1. 一级销售创建功能：测试alipay和crypto两种收款方式
2. 二级销售独立注册功能：测试两种收款方式
3. 数据库表结构：确认payment_method字段枚举值正确
4. 前端页面：确认收款方式选项正确显示

## 风险评估

- **低风险**：只是修复枚举值匹配问题，不影响现有数据
- **向后兼容**：新的枚举值涵盖了业务需求
- **回滚方案**：如有问题可以快速回滚到之前版本

## 部署时间

- 预计部署时间：2-3分钟
- 数据库结构自动修复：通过admin health API触发
- 验证时间：5分钟

---

**重要提醒**：部署前已按要求检查错题本 ✅  
**修复类型**：数据库表结构与API验证逻辑统一  
**影响范围**：一级销售和二级销售注册功能