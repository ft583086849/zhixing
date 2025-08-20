// 在浏览器控制台运行此代码检查Redux状态
console.log('请在浏览器控制台运行以下代码:');
console.log('─'.repeat(60));
console.log(`
// 1. 检查Redux store中的stats数据
const state = window.store?.getState();
if (state) {
  console.log('Redux admin.stats:', state.admin.stats);
  console.log('订单分类统计:');
  console.log('  7天免费:', state.admin.stats?.free_trial_orders, '个', state.admin.stats?.free_trial_percentage + '%');
  console.log('  1个月:', state.admin.stats?.one_month_orders, '个', state.admin.stats?.one_month_percentage + '%');
  console.log('  3个月:', state.admin.stats?.three_month_orders, '个', state.admin.stats?.three_month_percentage + '%');
  console.log('  6个月:', state.admin.stats?.six_month_orders, '个', state.admin.stats?.six_month_percentage + '%');
  console.log('  年费:', state.admin.stats?.yearly_orders, '个', state.admin.stats?.yearly_percentage + '%');
} else {
  console.log('Redux store不可用，尝试从React DevTools获取');
}

// 2. 直接调用API看返回值
AdminAPI.getStats().then(stats => {
  console.log('API返回的stats:', stats);
  console.log('订单分类数据:');
  console.log('  free_trial_orders:', stats.free_trial_orders);
  console.log('  free_trial_percentage:', stats.free_trial_percentage);
});
`);
console.log('─'.repeat(60));