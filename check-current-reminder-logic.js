// 分析当前催单逻辑对比
console.log('📋 当前催单逻辑分析');
console.log('=' .repeat(60));

console.log('\n🏢 客户管理页面催单逻辑（AdminCustomersOptimized.js）:');
console.log('1. 催单判断条件:');
console.log('   - 订单状态: confirmed_config 或 active');
console.log('   - 有金额: 7天内到期 + 已过期30天内');
console.log('   - 无金额: 3天内到期 + 已过期30天内');
console.log('');
console.log('2. 显示规则:');
console.log('   - 🔴 建议催单(X天) - 即将到期');
console.log('   - 🟠 建议催单(已过期X天) - 已过期但30天内');
console.log('   - ⚪ 无需催单 - 其他情况');

console.log('\n🏪 二级销售对账页面催单逻辑（SalesReconciliationPage.js）:');
console.log('1. 催单查询API (getSecondarySalesSettlement):');
console.log('   - 订单状态: pending_payment, pending_config');
console.log('   - 只查询未确认的订单');
console.log('   - 不包含已过期订单');
console.log('');
console.log('2. 显示规则:');
console.log('   - 有数据才显示催单模块');
console.log('   - 显示剩余天数标记');

console.log('\n❌ 问题对比:');
console.log('1. 订单状态不同:');
console.log('   - 客户管理: confirmed_config, active (已生效订单)');
console.log('   - 销售对账: pending_payment, pending_config (未确认订单)');
console.log('');
console.log('2. 过期处理不同:');
console.log('   - 客户管理: 包含已过期30天内的订单');
console.log('   - 销售对账: 不包含已过期订单');
console.log('');
console.log('3. 显示逻辑不同:');
console.log('   - 客户管理: 总是显示催单列，过滤查看');
console.log('   - 销售对账: 有数据才显示模块');

console.log('\n✅ 用户需求:');
console.log('1. 统一催单逻辑: 按照客户管理页面的逻辑');
console.log('2. 包含已过期: 要显示已过期的订单催单');
console.log('3. 总是显示: 催单模块总是显示（即使没有催单）');
console.log('4. 数据同步: 两个页面催单数据完全一致');

console.log('\n🔧 修改方案:');
console.log('1. 修改 getSecondarySalesSettlement API:');
console.log('   - 查询状态改为: confirmed_config, active');
console.log('   - 添加过期判断逻辑');
console.log('   - 包含已过期30天内的订单');
console.log('');
console.log('2. 修改前端显示逻辑:');
console.log('   - 催单模块总是显示');
console.log('   - 添加过期订单的显示');
console.log('   - 统一颜色标记规则');

console.log('\n📊 期望的催单规则（统一后）:');
console.log('有金额订单 (amount > 0):');
console.log('  - 7天内到期 → 🔴 建议催单(X天)');
console.log('  - 已过期30天内 → 🟠 建议催单(已过期X天)');
console.log('');
console.log('无金额订单 (7天免费):');
console.log('  - 3天内到期 → 🔴 建议催单(X天)');
console.log('  - 已过期30天内 → 🟠 建议催单(已过期X天)');
console.log('');
console.log('其他情况:');
console.log('  - ⚪ 无需催单');

console.log('\n请确认修改方案是否正确！');