// 在浏览器控制台运行这段代码

console.log('=== 检查数据流问题 ===');

// 1. 检查timeRange值
console.log('\n1. 检查时间范围:');
const reactComponents = document.querySelector('#root')._reactRootContainer?._internalRoot?.current;
if (reactComponents) {
  let component = reactComponents;
  while (component) {
    if (component.memoizedState?.timeRange !== undefined) {
      console.log('  timeRange =', component.memoizedState.timeRange);
      break;
    }
    component = component.child;
  }
}

// 2. 直接调用API
console.log('\n2. 直接调用API (不带参数):');
AdminAPI.getStats().then(stats => {
  console.log('  API返回:', stats);
  console.log('  free_trial_orders:', stats.free_trial_orders);
  console.log('  free_trial_percentage:', stats.free_trial_percentage);
});

// 3. 带参数调用API  
console.log('\n3. 带参数调用API:');
AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
  console.log('  API返回 (timeRange=all):', stats);
  console.log('  free_trial_orders:', stats.free_trial_orders);
  console.log('  free_trial_percentage:', stats.free_trial_percentage);
});

// 4. 检查Redux dispatch
console.log('\n4. 手动dispatch获取stats:');
if (window.store) {
  window.store.dispatch({
    type: 'admin/getStats/pending'
  });
  
  // 模拟调用
  AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
    window.store.dispatch({
      type: 'admin/getStats/fulfilled',
      payload: stats
    });
    console.log('  已dispatch新数据到Redux');
    console.log('  新的store.getState().admin.stats:', window.store.getState().admin.stats);
  });
}