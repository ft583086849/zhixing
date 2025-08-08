# 🚨 紧急修复：secondary_sales_name 字段不存在问题

## 问题描述
前端代码使用了不存在的 `secondary_sales_name` 字段，导致二级销售相关功能全部失效。

## 影响范围
1. **一级销售佣金计算错误** - 无法识别二级销售订单
2. **订单统计错误** - 无法区分直接订单和二级订单
3. **数据展示错误** - 二级销售信息无法显示

## 修复方案

### 方案A：修改前端代码（推荐）
使用正确的字段判断二级销售订单：

```javascript
// ❌ 错误的代码（现在）
const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);

// ✅ 正确的代码（应该改为）
// 方法1：使用 sales_type
const primaryDirectOrders = confirmedOrders.filter(order => order.sales_type !== 'secondary');
const secondaryOrders = confirmedOrders.filter(order => order.sales_type === 'secondary');

// 方法2：使用 secondary_sales_id
const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_id);
const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_id);
```

### 方案B：添加 secondary_sales_name 字段（不推荐）
在数据库中添加缺失的字段：

```sql
-- 添加字段
ALTER TABLE orders 
ADD COLUMN secondary_sales_name VARCHAR(255);

-- 更新现有数据
UPDATE orders o
SET secondary_sales_name = s.wechat_name
FROM secondary_sales s
WHERE o.secondary_sales_id = s.id;
```

## 需要修改的文件

### 1. client/src/pages/PrimarySalesSettlementPage.js
- 第144行和148行

### 2. client/src/components/admin/AdminSales.js
- 第120行和123行

### 3. client/src/services/api.js
- 佣金计算相关逻辑

## 临时解决方案

在修复部署之前，可以在浏览器控制台运行：

```javascript
// 临时修复：为订单添加 secondary_sales_name 属性
(async () => {
    const supabase = window.supabaseClient || window.supabase;
    
    // 获取所有订单
    const { data: orders } = await supabase.from('orders').select('*');
    
    // 获取所有二级销售
    const { data: secondarySales } = await supabase.from('secondary_sales').select('*');
    
    // 为每个订单添加 secondary_sales_name
    orders.forEach(order => {
        if (order.secondary_sales_id) {
            const sale = secondarySales.find(s => s.id === order.secondary_sales_id);
            order.secondary_sales_name = sale ? sale.wechat_name : null;
        } else if (order.sales_type === 'secondary') {
            // 通过 sales_code 查找
            const sale = secondarySales.find(s => s.sales_code === order.sales_code);
            order.secondary_sales_name = sale ? sale.wechat_name : null;
        }
    });
    
    console.log('✅ 临时修复完成');
    window.tempFixedOrders = orders;
})();
```

## 推荐方案

**使用方案A - 修改前端代码**

理由：
1. 不需要修改数据库结构
2. 使用已存在的字段更可靠
3. 符合数据库规范化原则（避免冗余）
