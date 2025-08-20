// 测试转化率筛选功能

console.log('=== 测试转化率筛选功能 ===\n');

console.log('测试说明：');
console.log('1. 访问 http://localhost:3000/admin/overview');
console.log('2. 页面上的主要数据（统计卡片、销售层级、订单分类、Top5）应该始终显示全部数据');
console.log('3. 只有"转化率统计"表格会根据筛选条件变化\n');

console.log('测试场景：');
console.log('\n场景1: 时间范围筛选');
console.log('- 选择"今天" → 转化率统计显示今天的转化率，其他数据不变');
console.log('- 选择"本周" → 转化率统计显示本周的转化率，其他数据不变');
console.log('- 选择"本月" → 转化率统计显示本月的转化率，其他数据不变');

console.log('\n场景2: 销售类型筛选');
console.log('- 选择"一级销售" + 点击确认 → 转化率统计只显示一级销售的订单转化率');
console.log('- 选择"二级销售" + 点击确认 → 转化率统计只显示二级销售的订单转化率');
console.log('- 选择"独立销售" + 点击确认 → 转化率统计只显示独立销售的订单转化率');

console.log('\n场景3: 具体销售筛选');
console.log('- 选择某个具体销售微信 + 点击确认 → 转化率统计只显示该销售的订单转化率');

console.log('\n场景4: 组合筛选');
console.log('- 选择"今天" + "一级销售" + 点击确认');
console.log('  → 转化率统计显示今天一级销售的订单转化率');
console.log('- 选择"本月" + 具体销售 + 点击确认');
console.log('  → 转化率统计显示本月该销售的订单转化率');

console.log('\n场景5: 重置功能');
console.log('- 点击"重置"按钮 → 清空所有筛选，转化率统计恢复显示全部数据');

console.log('\n验证要点：');
console.log('✓ 主要统计数据（生效订单数、总收入等）不受筛选影响');
console.log('✓ 销售层级统计不受筛选影响');
console.log('✓ 订单分类统计（7天免费等）不受筛选影响');
console.log('✓ Top5销售排行榜不受筛选影响');
console.log('✓ 只有转化率统计表格会根据筛选条件动态变化');

console.log('\n浏览器控制台调试命令：');
console.log('// 检查转化率统计组件的状态');
console.log('const table = document.querySelector(\'.ant-table\');');
console.log('console.log(\'转化率表格:\', table);');
console.log('\n// 手动调用API测试筛选');
console.log('AdminAPI.getConversionStats({ sales_type: "primary" }).then(console.log);');
console.log('AdminAPI.getConversionStats({ timeRange: "today" }).then(console.log);');