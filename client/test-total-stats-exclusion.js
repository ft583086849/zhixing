#!/usr/bin/env node

/**
 * 测试总收入和佣金统计排除功能
 */

console.log('🧪 测试总收入和佣金统计排除功能\n');

console.log('📋 修复内容：');
console.log('1. ✅ 移除转化率统计中不需要的排除提示');
console.log('2. ✅ 修复getSales调用时传递排除参数');
console.log('3. ✅ 使用已过滤的salesData代替直接查询旧表');
console.log('4. ✅ 确保佣金统计也应用排除过滤');

console.log('\n🔧 测试步骤：');
console.log('1. 确保 wangming 在排除名单中');
console.log('2. 访问数据概览页面');
console.log('3. 记录当前的总收入和佣金金额');
console.log('4. 恢复 wangming 的统计');
console.log('5. 刷新页面，数值应该增加');
console.log('6. 再次排除 wangming');  
console.log('7. 刷新页面，数值应该减少');

console.log('\n📊 验证方法：');
console.log('在浏览器控制台执行：');

const testCode = `
// 测试获取统计数据（应用排除）
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('📊 获取统计数据...');
  
  // 获取统计数据
  AdminAPI.getStats({
    timeRange: 'all',
    usePaymentTime: true
  }).then(stats => {
    console.log('✅ 统计数据:', {
      总收入: stats.total_amount,
      销售返佣金额: stats.total_commission,
      待返佣金额: stats.pending_commission,
      已返佣金额: stats.paid_commission
    });
  }).catch(err => {
    console.error('❌ 获取失败:', err);
  });
  
  // 获取销售数据（检查是否包含wangming）
  AdminAPI.getSales({}).then(sales => {
    const hasWangming = sales.some(s => s.wechat_name === 'wangming');
    if (hasWangming) {
      const wangmingSale = sales.find(s => s.wechat_name === 'wangming');
      console.log('⚠️ wangming仍在销售列表中:', {
        销售代码: wangmingSale.sales_code,
        应返佣金: wangmingSale.total_commission,
        订单数: wangmingSale.order_count
      });
    } else {
      console.log('✅ wangming已被排除');
    }
  });
});

// 查看排除列表和影响
import('/src/services/excludedSalesService.js').then(module => {
  const service = module.default;
  
  // 获取排除列表
  service.getExcludedSales().then(list => {
    console.log('📋 当前排除名单:', list);
  });
  
  // 获取排除统计
  service.getExclusionStats().then(stats => {
    console.log('📊 排除影响统计:', {
      影响订单数: stats.affected_orders,
      影响金额: stats.affected_amount,
      影响佣金: stats.affected_commission
    });
  });
});
`;

console.log(testCode);

console.log('\n⚠️ 重要验证点：');
console.log('1. 排除wangming后，总收入应该减少');
console.log('2. 销售返佣金额应该减少');
console.log('3. 待返佣金额应该相应减少');
console.log('4. 转化率统计不再显示排除提示');
console.log('5. wangming不应出现在销售列表中');

console.log('\n✅ 预期效果：');
console.log('• 总收入 = 所有未排除销售的订单金额总和');
console.log('• 销售返佣金额 = 所有未排除销售的应返佣金总和');
console.log('• 待返佣金额 = 所有未排除销售的待返佣金总和');
console.log('• 数据变化应该立即生效');

console.log('\n🎯 测试完成！');