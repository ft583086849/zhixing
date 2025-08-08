# ✅ 修复 secondary_sales_name 字段不存在问题 - 已完成

## 问题根源
- **错误**：前端代码使用了不存在的 `secondary_sales_name` 字段
- **实际**：数据库中只有 `secondary_sales_id` 和 `sales_type` 字段

## 已完成的修改

### 1. ✅ client/src/pages/PrimarySalesSettlementPage.js
```javascript
// 修改前（使用不存在的字段）
const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);

// 修改后（使用正确的字段）
const primaryDirectOrders = confirmedOrders.filter(order => order.sales_type !== 'secondary');
const secondaryOrders = confirmedOrders.filter(order => order.sales_type === 'secondary');
```

### 2. ✅ client/src/components/admin/AdminSales.js
```javascript
// 修改前
const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);

// 修改后
const primaryDirectOrders = confirmedOrders.filter(order => order.sales_type !== 'secondary');
const secondaryOrders = confirmedOrders.filter(order => order.sales_type === 'secondary');
```

### 3. ✅ 表格显示修改
```javascript
// 修改前
{
  title: '二级销售',
  dataIndex: 'secondary_sales_name',
  render: (name) => name || '直接销售'
}

// 修改后
{
  title: '销售类型',
  dataIndex: 'sales_type',
  render: (type) => type === 'secondary' ? '二级销售' : '直接销售'
}
```

## 修复效果

1. **佣金计算正确**：能正确区分一级销售直接订单和二级销售订单
2. **数据统计准确**：订单统计将正确反映销售类型
3. **界面显示正常**：表格中正确显示销售类型

## 部署步骤

1. **提交代码**
```bash
git add -A
git commit -m "fix: 修复secondary_sales_name字段不存在的问题

- 使用sales_type字段替代不存在的secondary_sales_name
- 修复佣金计算逻辑
- 修复订单分类显示"
```

2. **推送到GitHub**
```bash
git push origin main
```

3. **Vercel自动部署**
- 等待Vercel自动部署完成（约1-2分钟）

## 验证方法

部署后，在浏览器控制台运行：

```javascript
// 验证修复是否生效
(async () => {
    const supabase = window.supabaseClient || window.supabase;
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .limit(10);
    
    console.log('订单数据检查:');
    orders.forEach((order, i) => {
        console.log(`订单${i+1}:`, {
            sales_type: order.sales_type,
            secondary_sales_id: order.secondary_sales_id,
            判断为: order.sales_type === 'secondary' ? '二级销售订单' : '一级销售直接订单'
        });
    });
})();
```

## 注意事项

1. **数据迁移**：需要确保所有订单都有正确的 `sales_type` 值
2. **新订单创建**：创建订单时必须设置正确的 `sales_type`
3. **向后兼容**：如果有历史数据没有 `sales_type`，可能需要数据迁移脚本

## 问题已解决 ✅

- 前端代码已修正为使用正确的字段
- 不再依赖不存在的 `secondary_sales_name`
- 使用 `sales_type` 作为判断标准更加准确和规范
