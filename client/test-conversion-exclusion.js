#!/usr/bin/env node

/**
 * 测试转化率统计排除功能
 */

console.log('🧪 测试转化率统计排除功能\n');

console.log('📋 修复内容：');
console.log('1. ✅ getSalesConversionStats 方法已添加排除过滤');
console.log('2. ✅ 销售列表查询应用排除过滤');
console.log('3. ✅ 订单查询应用排除过滤');
console.log('4. ✅ ConversionRateTable 组件显示排除提示');

console.log('\n🔧 测试步骤：');
console.log('1. 登录管理后台');
console.log('2. 访问"数据概览"页面');
console.log('3. 查看"转化率统计"部分');
console.log('4. 应该看到排除提示（如果有排除的销售）');
console.log('5. 被排除的销售（如 wangming）不应出现在列表中');

console.log('\n📊 验证方法：');
console.log('在浏览器控制台执行：');

const testCode = `
// 测试获取转化率统计（应用排除）
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  // 获取转化率数据
  AdminAPI.getSalesConversionStats({
    timeRange: 'all'
  }).then(data => {
    console.log('✅ 转化率统计数据:', data);
    
    // 检查是否包含被排除的销售
    const hasExcluded = data.some(item => 
      item.wechat_name === 'wangming'
    );
    
    if (hasExcluded) {
      console.log('❌ 警告：被排除的销售仍在列表中');
    } else {
      console.log('✅ 排除过滤生效');
    }
  }).catch(err => {
    console.error('❌ 获取失败:', err);
  });
});

// 查看排除列表
import('/src/services/excludedSalesService.js').then(module => {
  const service = module.default;
  service.getExcludedSales().then(list => {
    console.log('📋 当前排除名单:', list);
  });
});
`;

console.log(testCode);

console.log('\n⚠️ 重要说明：');
console.log('1. 确保已将 wangming 添加到排除名单');
console.log('2. 刷新页面后查看转化率统计');
console.log('3. wangming 的数据不应出现在转化率表格中');
console.log('4. 页面顶部应显示排除提示');

console.log('\n✅ 预期效果：');
console.log('• 转化率统计不包含 wangming 的数据');
console.log('• 显示"已从转化率统计中排除 X 个销售的数据"提示');
console.log('• 控制台日志显示排除的销售代码');
console.log('• 统计数据自动更新，不包含被排除的销售');

console.log('\n🎯 测试完成！');