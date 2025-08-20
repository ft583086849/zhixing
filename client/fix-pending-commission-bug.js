#!/usr/bin/env node

/**
 * 修复待返佣金显示错误的问题
 * 
 * 问题：页面显示待返佣金3276美元，实际应该是0
 * 原因：可能错误地使用了订单表的commission_amount总和
 */

console.log('🔧 修复待返佣金显示错误\n');

console.log('问题诊断：');
console.log('1. 销售表显示所有佣金都已返还（待返=0）');
console.log('2. 订单表commission_amount总和=3276');
console.log('3. 页面显示待返佣金=3276美元');
console.log('\n结论：代码某处错误地把订单的commission_amount当作了待返佣金！');

console.log('\n请在浏览器控制台执行以下代码进行深度调试：\n');

const debugCode = `
// 深度调试pending_commission
(async function() {
  console.log('🔍 开始深度调试pending_commission...');
  
  // 1. 直接测试getSales
  console.log('\\n1️⃣ 测试getSales方法:');
  const { AdminAPI } = await import('/src/services/api.js');
  
  const salesData = await AdminAPI.getSales({});
  let manualPending = 0;
  salesData.forEach(sale => {
    const pending = (sale.total_commission || 0) - (sale.paid_commission || 0);
    manualPending += pending;
  });
  console.log('  getSales返回的销售数:', salesData.length);
  console.log('  手动计算待返佣金:', manualPending);
  
  // 2. 测试getStats内部逻辑
  console.log('\\n2️⃣ 测试getStats方法:');
  
  // 替换console.log来捕获内部日志
  const originalLog = console.log;
  let capturedLogs = [];
  console.log = function(...args) {
    if (args[0] && args[0].includes('实时计算的佣金汇总')) {
      capturedLogs.push(args);
    }
    originalLog.apply(console, args);
  };
  
  const stats = await AdminAPI.getStats({ timeRange: 'all' });
  
  // 恢复console.log
  console.log = originalLog;
  
  console.log('  getStats返回的pending_commission:', stats.pending_commission);
  console.log('  getStats返回的pending_commission_amount:', stats.pending_commission_amount);
  
  if (capturedLogs.length > 0) {
    console.log('\\n  捕获的内部日志:');
    capturedLogs.forEach(log => console.log(...log));
  }
  
  // 3. 检查是否有其他地方修改了值
  console.log('\\n3️⃣ 验证订单表数据:');
  const { default: SupabaseService } = await import('/src/services/supabase.js');
  const supabase = SupabaseService.supabase;
  
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('commission_amount, status')
    .neq('status', 'rejected');
  
  const orderCommissionSum = orders.reduce((sum, o) => 
    sum + parseFloat(o.commission_amount || 0), 0);
  
  console.log('  订单表commission_amount总和:', orderCommissionSum);
  
  // 4. 关键判断
  console.log('\\n4️⃣ 问题诊断:');
  if (stats.pending_commission === orderCommissionSum) {
    console.log('  ❌ 确认BUG：pending_commission等于订单的commission_amount总和！');
    console.log('  应该是:', manualPending);
    console.log('  实际是:', stats.pending_commission);
    console.log('  错误值来源: 订单表commission_amount总和');
  } else if (stats.pending_commission === manualPending) {
    console.log('  ✅ 值是正确的，从销售表计算得出');
  } else {
    console.log('  ⚠️ 值不匹配任何已知来源');
    console.log('  期望值（销售表）:', manualPending);
    console.log('  实际值:', stats.pending_commission);
    console.log('  订单表值:', orderCommissionSum);
  }
  
  // 5. 检查是否有缓存问题
  console.log('\\n5️⃣ 检查缓存:');
  console.log('  localStorage中是否有相关缓存:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('stats') || key.includes('commission')) {
      console.log('    ', key, ':', localStorage[key]);
    }
  });
  
  // 6. 修复建议
  console.log('\\n6️⃣ 修复建议:');
  console.log('如果确认是BUG，需要：');
  console.log('1. 检查getStats方法中是否有地方错误地累加了订单的commission_amount');
  console.log('2. 确保pending_commission只从销售表计算');
  console.log('3. 验证getSales方法返回的数据是否正确');
  
})();
`;

console.log(debugCode);

console.log('\n✅ 正确的逻辑应该是：');
console.log('• pending_commission = SUM(销售表的 total_commission - paid_commission)');
console.log('• 不应该使用订单表的commission_amount');
console.log('• 如果所有佣金都已返还，pending_commission应该是0');