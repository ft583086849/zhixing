#!/usr/bin/env node

/**
 * 调试数据概览页面一直加载的问题
 */

console.log('🔍 调试数据概览页面加载问题\n');

console.log('请在管理后台的浏览器控制台执行以下代码：\n');

const debugCode = `
// 调试数据概览页面加载问题
(async function() {
  console.log('🔍 调试数据概览页面加载问题...');
  
  try {
    // 1. 检查Redux状态
    console.log('\\n1️⃣ 检查Redux状态:');
    const state = window.__REDUX_STORE__ ? window.__REDUX_STORE__.getState() : null;
    
    if (state) {
      console.log('admin.loading:', state.admin?.loading);
      console.log('admin.stats:', state.admin?.stats);
      console.log('admin.error:', state.admin?.error);
    } else {
      console.log('无法访问Redux状态，尝试其他方法...');
    }
    
    // 2. 直接调用API测试
    console.log('\\n2️⃣ 直接调用API测试:');
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    
    console.time('getStats调用时间');
    
    try {
      const stats = await AdminAPI.getStats({ 
        timeRange: 'all',
        usePaymentTime: true 
      });
      
      console.timeEnd('getStats调用时间');
      
      if (stats) {
        console.log('✅ API返回成功');
        console.log('返回数据示例:', {
          total_orders: stats.total_orders,
          total_amount: stats.total_amount,
          loading: false
        });
      }
    } catch (apiError) {
      console.timeEnd('getStats调用时间');
      console.error('❌ API调用失败:', apiError);
      console.log('错误详情:', {
        message: apiError.message,
        stack: apiError.stack
      });
    }
    
    // 3. 检查网络请求
    console.log('\\n3️⃣ 检查网络请求:');
    console.log('打开Network标签页，查看是否有以下请求:');
    console.log('• orders_optimized (订单数据)');
    console.log('• sales_optimized (销售数据)');
    console.log('• overview_stats (统计数据)');
    console.log('检查这些请求是否:');
    console.log('  - 一直在pending状态');
    console.log('  - 返回错误');
    console.log('  - 响应时间过长');
    
    // 4. 检查排除功能是否影响
    console.log('\\n4️⃣ 检查排除功能影响:');
    const ExcludedSalesService = (await import('/src/services/excludedSalesService.js')).default;
    
    try {
      const excludedCodes = await ExcludedSalesService.getExcludedSalesCodes();
      console.log('当前排除的销售代码:', excludedCodes);
      
      if (excludedCodes.length > 0) {
        console.log('⚠️ 有排除的销售，可能影响查询性能');
        
        // 测试不排除的查询
        console.log('\\n测试不排除的查询:');
        console.time('不排除查询时间');
        const statsWithoutExclusion = await AdminAPI.getStats({ 
          timeRange: 'all',
          skipExclusion: true
        });
        console.timeEnd('不排除查询时间');
        
        if (statsWithoutExclusion) {
          console.log('✅ 不排除查询成功');
        }
      } else {
        console.log('✅ 没有排除的销售');
      }
    } catch (error) {
      console.log('排除服务检查失败:', error);
    }
    
    // 5. 检查localStorage
    console.log('\\n5️⃣ 检查本地存储:');
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    console.log('Token存在:', !!token);
    
    // 6. 建议解决方案
    console.log('\\n💡 建议解决方案:');
    console.log('1. 刷新页面: Ctrl+F5 (强制刷新)');
    console.log('2. 清除缓存: 开发者工具 > Application > Clear Storage');
    console.log('3. 检查网络: 查看是否有请求超时');
    console.log('4. 查看控制台错误: 是否有其他JavaScript错误');
    
    // 7. 尝试手动触发数据加载
    console.log('\\n7️⃣ 尝试手动重新加载数据:');
    if (window.location.pathname.includes('/admin/dashboard')) {
      console.log('执行以下代码手动重新加载:');
      console.log(\`
        const dispatch = window.__REDUX_STORE__ ? window.__REDUX_STORE__.dispatch : null;
        if (dispatch) {
          const { getStats } = await import('/src/store/slices/adminSlice.js');
          dispatch(getStats({ timeRange: 'all' }));
          console.log('已触发重新加载');
        }
      \`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
})();
`;

console.log(debugCode);

console.log('\n📋 快速修复方案：');
console.log('1. 先执行上述调试代码，查看具体问题');
console.log('2. 如果是网络请求卡住，尝试刷新页面');
console.log('3. 如果是排除功能影响，临时禁用排除');
console.log('4. 查看浏览器控制台是否有错误信息');