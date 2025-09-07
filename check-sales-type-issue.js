// 检查销售分类问题的脚本
console.log('=== 销售分类问题分析 ===\n');

console.log('问题1: 订单管理页面中生效时间和到期时间显示为空');
console.log('根据代码分析:');
console.log('- AdminOrders.js 第446-458行显示，生效时间取自 effective_time 字段');
console.log('- 到期时间取自 expiry_time 字段');
console.log('- 渲染逻辑: time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-"');
console.log('- 可能原因: 数据库中这两个字段为空值(null)或未正确设置\n');

console.log('问题2: 销售分类错误 - 二级销售被标记为独立销售');
console.log('根据代码分析 (AdminOrders.js 第346-386行):');
console.log('销售类型判断逻辑:');
console.log('1. 优先检查 secondary_sales 对象');
console.log('   - 如果有 primary_sales_id，则为"二级销售"');  
console.log('   - 如果没有 primary_sales_id，则为"独立销售"');
console.log('2. 其次检查 primary_sales 对象，标记为"一级销售"');
console.log('3. 最后使用 sales_wechat_name，标记为"未知类型"\n');

console.log('可能的问题原因:');
console.log('1. 数据库表关联问题:');
console.log('   - secondary_sales 表中的 primary_sales_id 字段为空');
console.log('   - 或者JOIN查询没有正确关联到 secondary_sales 数据');
console.log('');
console.log('2. 数据一致性问题:');
console.log('   - sales_optimized 表中 sales_type 为 "secondary"');
console.log('   - 但实际订单查询时关联的数据显示为独立销售');
console.log('');

console.log('=== 需要验证的数据 ===');
console.log('1. 检查 orders_optimized 表的时间字段数据');
console.log('2. 检查 sales_optimized 表的 sales_type 和 parent_sales_code 字段');
console.log('3. 检查 secondary_sales 表的 primary_sales_id 字段');
console.log('4. 验证订单查询的JOIN逻辑是否正确关联销售数据');