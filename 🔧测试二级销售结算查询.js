/**
 * 测试二级销售结算查询功能
 * 在浏览器控制台运行此脚本
 */

async function testSecondarySalesSettlement() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🧪 测试二级销售结算查询功能');
  console.log('='.repeat(60));
  
  // 检查 salesAPI 是否存在
  if (!window.salesAPI) {
    console.error('❌ salesAPI 未定义，请确保页面已加载完成');
    return;
  }
  
  // 检查方法是否存在
  console.log('\n📋 步骤1：检查 API 方法');
  if (typeof window.salesAPI.getSecondarySalesSettlement === 'function') {
    console.log('✅ salesAPI.getSecondarySalesSettlement 方法已定义');
  } else {
    console.error('❌ salesAPI.getSecondarySalesSettlement 方法不存在');
    console.log('可用的 salesAPI 方法：');
    Object.keys(window.salesAPI).forEach(key => {
      if (typeof window.salesAPI[key] === 'function') {
        console.log(`  - ${key}`);
      }
    });
    return;
  }
  
  // 测试查询二级销售 Zhixing 的数据
  console.log('\n📋 步骤2：查询二级销售 Zhixing 的结算数据');
  try {
    const params = {
      wechat_name: 'Zhixing'
    };
    
    console.log('查询参数:', params);
    
    const response = await window.salesAPI.getSecondarySalesSettlement(params);
    
    if (response.success) {
      console.log('✅ 查询成功！');
      console.log('\n📊 销售信息:');
      console.log('- 微信号:', response.data.sales?.wechat_name);
      console.log('- 销售代码:', response.data.sales?.sales_code);
      console.log('- 佣金率:', response.data.sales?.commission_rate);
      console.log('- 总订单数:', response.data.sales?.total_orders);
      console.log('- 总金额:', response.data.sales?.total_amount);
      console.log('- 总佣金:', response.data.sales?.total_commission);
      
      console.log('\n📊 统计数据:');
      console.log('- 总订单数:', response.data.stats?.totalOrders);
      console.log('- 总金额:', response.data.stats?.totalAmount);
      console.log('- 总佣金:', response.data.stats?.totalCommission);
      console.log('- 待催单数:', response.data.stats?.pendingReminderCount);
      
      if (response.data.orders && response.data.orders.length > 0) {
        console.log('\n📋 最近订单:');
        response.data.orders.slice(0, 5).forEach((order, index) => {
          console.log(`\n订单 ${index + 1}:`);
          console.log('- 订单ID:', order.id);
          console.log('- 客户微信:', order.customer_wechat);
          console.log('- 金额:', order.amount);
          console.log('- 状态:', order.status);
          console.log('- 确认状态:', order.config_confirmed);
        });
      } else {
        console.log('\n📋 暂无订单数据');
      }
      
      return response.data;
    } else {
      console.error('❌ 查询失败:', response.message);
    }
  } catch (error) {
    console.error('❌ 查询出错:', error.message || error);
    console.error('错误详情:', error);
  }
  
  // 测试通过销售代码查询
  console.log('\n' + '='.repeat(60));
  console.log('📋 步骤3：通过销售代码查询（如果知道的话）');
  console.log('如果你知道 Zhixing 的销售代码，可以运行：');
  console.log(`
// 替换 YOUR_SALES_CODE 为实际的销售代码
await salesAPI.getSecondarySalesSettlement({
  sales_code: 'YOUR_SALES_CODE'
});
  `);
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 问题诊断总结');
  console.log('='.repeat(60));
  console.log(`
如果仍然出现错误，可能的原因：
1. 页面需要刷新以加载最新的代码
2. 二级销售 Zhixing 可能未在数据库中注册
3. 数据库权限问题

解决方案：
1. 刷新页面（F5）后重新测试
2. 确认 Zhixing 已在二级销售表中注册
3. 检查数据库的 secondary_sales 表数据
  `);
}

// 执行测试
testSecondarySalesSettlement();
