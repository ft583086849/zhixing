/**
 * 快速检查和修复 salesAPI 加载问题
 * 在浏览器控制台运行
 */

// 立即检查
console.clear();
console.log('='.repeat(60));
console.log('🔍 检查 API 加载状态');
console.log('='.repeat(60));

// 1. 检查全局对象
console.log('\n📋 检查全局 API 对象:');
console.log('window.salesAPI 存在?', typeof window.salesAPI !== 'undefined' ? '✅ 是' : '❌ 否');
console.log('window.SalesAPI 存在?', typeof window.SalesAPI !== 'undefined' ? '✅ 是' : '❌ 否');

// 2. 如果 salesAPI 存在，检查方法
if (window.salesAPI) {
  console.log('\n✅ salesAPI 已加载');
  console.log('可用方法:');
  Object.keys(window.salesAPI).forEach(key => {
    if (typeof window.salesAPI[key] === 'function') {
      console.log(`  - ${key}`);
    }
  });
  
  // 检查关键方法
  const hasMethod = typeof window.salesAPI.getSecondarySalesSettlement === 'function';
  console.log('\ngetSecondarySalesSettlement 方法存在?', hasMethod ? '✅ 是' : '❌ 否');
  
  if (hasMethod) {
    console.log('\n🎉 API 已正确加载！现在可以查询了。');
    console.log('正在为您查询 Zhixing 的数据...\n');
    
    // 自动查询
    window.salesAPI.getSecondarySalesSettlement({
      wechat_name: 'Zhixing'
    }).then(response => {
      if (response.success) {
        console.log('✅ 查询成功！');
        console.log('销售信息:', response.data.sales);
        console.log('订单数量:', response.data.stats?.totalOrders || 0);
        console.log('总金额:', response.data.stats?.totalAmount || 0);
        console.log('总佣金:', response.data.stats?.totalCommission || 0);
        
        // 在页面上触发查询
        const input = document.querySelector('input[placeholder*="微信"]');
        const button = document.querySelector('button[type="submit"], button:contains("查询")');
        if (input && button) {
          input.value = 'Zhixing';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(() => {
            button.click();
            console.log('\n✅ 已自动触发页面查询');
          }, 100);
        }
      } else {
        console.error('查询失败:', response.message);
      }
    }).catch(error => {
      console.error('查询出错:', error);
    });
  }
} else {
  console.log('\n❌ salesAPI 未加载');
  console.log('\n🔧 尝试从模块中导入...');
  
  // 检查是否在 React 应用中
  if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('检测到 React 应用');
    
    // 尝试通过 Redux store 访问
    if (window.store) {
      console.log('找到 Redux store');
      const state = window.store.getState();
      console.log('Store state:', state);
    }
    
    // 提供手动导入方案
    console.log('\n💡 解决方案:');
    console.log('1. 强制刷新页面: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
    console.log('2. 清除浏览器缓存后重新访问');
    console.log('3. 在无痕/隐私模式下打开页面');
    console.log('4. 检查浏览器控制台是否有其他错误');
  }
}

// 3. 检查页面是否完全加载
console.log('\n📋 页面加载状态:');
console.log('DOM 状态:', document.readyState);
console.log('页面 URL:', window.location.href);

// 4. 检查是否有加载错误
const scripts = Array.from(document.querySelectorAll('script[src]'));
console.log(`\n📋 已加载 ${scripts.length} 个脚本文件`);

// 5. 提供快速修复
if (!window.salesAPI && window.SalesAPI) {
  console.log('\n🔧 尝试快速修复...');
  window.salesAPI = window.SalesAPI;
  console.log('✅ 已将 SalesAPI 映射到 salesAPI');
}

console.log('\n' + '='.repeat(60));
console.log('诊断完成！');
console.log('='.repeat(60));

