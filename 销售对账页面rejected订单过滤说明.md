# 📊 销售对账页面 Rejected订单过滤说明

## ✅ 当前过滤状态

### 1️⃣ 一级销售对账页面 (Primary Sales Settlement)
**页面地址**: https://zhixing-seven.vercel.app/primary-sales-settlement

#### 订单列表过滤：
- ✅ **已过滤rejected订单**
- 只显示以下状态的订单：
  - `confirmed` - 已确认
  - `confirmed_config` - 已配置确认
  - `confirmed_configuration` - 已配置确认（兼容）
  - `active` - 活跃

#### 统计数据过滤：
- ✅ **总订单数**：不包含rejected订单
- ✅ **总金额**：不包含rejected订单金额
- ✅ **佣金计算**：基于已确认订单金额

#### 代码位置：
```javascript
// supabase.js 第234行
.in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
```

### 2️⃣ 二级销售对账页面 (Secondary Sales Reconciliation)
**页面地址**: https://zhixing-seven.vercel.app/sales-reconciliation

#### 订单列表过滤：
- ✅ **已过滤rejected订单**
- 只显示已确认状态的订单

#### 统计数据过滤：
- ✅ **总订单数**：不包含rejected订单（已修复）
- ✅ **总金额**：不包含rejected订单金额
- ✅ **佣金计算**：基于已确认订单金额

#### 代码位置：
```javascript
// supabase.js 第384行
.in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
```

## 🔧 最新修复

### 修复内容：
在计算二级销售统计信息时，原来的代码会包含rejected订单的金额，现已修复：

```javascript
// 修复前：
const allOrdersAmount = allOrders?.reduce(...) // 包含rejected

// 修复后：
const nonRejectedOrders = allOrders?.filter(o => o.status !== 'rejected')
const allOrdersAmount = nonRejectedOrders.reduce(...) // 不包含rejected
```

## 📌 过滤规则总结

### 完全排除的订单状态：
- ❌ `rejected` - 已拒绝
- ❌ `cancelled` - 已取消（不在确认列表中）
- ❌ `refunded` - 已退款（不在确认列表中）
- ❌ `expired` - 已过期（不在确认列表中）
- ❌ `pending_payment` - 待支付（不在确认列表中）
- ❌ `pending_config` - 待配置（不在确认列表中）

### 包含在统计中的订单状态：
- ✅ `confirmed` - 已确认
- ✅ `confirmed_config` - 已配置确认  
- ✅ `confirmed_configuration` - 已配置确认（兼容）
- ✅ `active` - 活跃

## 📊 影响范围

### 受影响的数据：
1. **订单列表** - 不显示rejected订单
2. **总订单数** - 不计入rejected订单
3. **总金额** - 不包含rejected订单金额
4. **佣金计算** - 仅基于已确认订单
5. **催单列表** - 只显示pending状态，不包括rejected

### 不受影响的功能：
- 管理员可以在订单管理页面查看所有订单（包括rejected）
- 销售可以在催单列表看到待处理订单

## ✨ 效果

- 销售看到的都是有效订单数据
- 佣金计算准确，不会因为rejected订单影响收入
- 统计数据真实反映实际业务情况
