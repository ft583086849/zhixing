#!/usr/bin/env node

/**
 * 直接测试API返回的pending_commission值
 */

console.log('🔍 测试API返回的pending_commission值\n');

console.log('请在浏览器控制台执行以下代码来调试API:\n');

const testCode = `
// 1. 测试getStats API
console.log('🔍 测试getStats API...');

// 导入API模块
import('/src/services/api.js').then(async (module) => {
  const AdminAPI = module.AdminAPI;
  
  try {
    // 调用getStats获取统计数据
    const stats = await AdminAPI.getStats({ timeRange: 'all' });
    
    console.log('\\n📊 API返回的统计数据:');
    console.log('------- 佣金相关字段 -------');
    console.log('total_commission:', stats.total_commission);
    console.log('paid_commission_amount:', stats.paid_commission_amount);
    console.log('pending_commission_amount:', stats.pending_commission_amount, '⭐ 关键字段');
    console.log('pending_commission:', stats.pending_commission, '⭐ 兼容字段');
    console.log('commission_amount:', stats.commission_amount);
    
    // 验证是否等于3276
    if (stats.pending_commission === 3276 || stats.pending_commission_amount === 3276) {
      console.log('\\n❌ 错误！发现3276值！');
      console.log('这个值不应该是订单表的commission_amount总和！');
      
      // 验证销售表实际待返佣金
      console.log('\\n🔍 验证销售表数据...');
      const sales = await AdminAPI.getSales({});
      
      let manualPending = 0;
      let salesWithPending = [];
      
      sales.forEach(sale => {
        const total = sale.total_commission || 0;
        const paid = sale.paid_commission || 0;
        const pending = total - paid;
        
        manualPending += pending;
        
        if (pending > 0) {
          salesWithPending.push({
            name: sale.wechat_name,
            pending: pending
          });
        }
      });
      
      console.log('手动计算的待返佣金:', manualPending);
      console.log('有待返佣金的销售:', salesWithPending);
      
      if (manualPending === 0) {
        console.log('\\n✅ 确认：销售表显示待返佣金=0');
        console.log('❌ BUG：API却返回3276');
        console.log('🔍 需要找出API中错误的计算逻辑');
      }
    } else if (stats.pending_commission === 0) {
      console.log('\\n✅ 正确：pending_commission = 0');
      console.log('API返回值与销售表数据一致');
    } else {
      console.log('\\n⚠️ 意外值:', stats.pending_commission);
      console.log('需要进一步分析');
    }
    
    // 检查是否有缓存问题
    console.log('\\n🔍 检查缓存状态...');
    if (window.localStorage) {
      const adminStats = localStorage.getItem('admin-stats');
      if (adminStats) {
        console.log('发现缓存数据:', JSON.parse(adminStats));
      } else {
        console.log('无缓存数据');
      }
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
});

// 2. 直接测试数据库查询
console.log('\\n🔍 直接测试数据库查询...');

import('/src/services/supabase.js').then(async (module) => {
  const SupabaseService = module.default;
  const supabase = SupabaseService.supabase;
  
  try {
    // 查询销售表
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('wechat_name, total_commission, paid_commission');
    
    let totalCommission = 0;
    let paidCommission = 0;
    let pendingCommission = 0;
    
    console.log('\\n📋 销售表详细数据:');
    sales.forEach(sale => {
      const total = parseFloat(sale.total_commission || 0);
      const paid = parseFloat(sale.paid_commission || 0);
      const pending = total - paid;
      
      totalCommission += total;
      paidCommission += paid;
      pendingCommission += pending;
      
      if (total > 0) {
        console.log(\`\${sale.wechat_name}: 应返\${total}, 已返\${paid}, 待返\${pending}\`);
      }
    });
    
    console.log('\\n💰 汇总:');
    console.log('应返佣金总额:', totalCommission.toFixed(2));
    console.log('已返佣金总额:', paidCommission.toFixed(2));
    console.log('待返佣金总额:', pendingCommission.toFixed(2), '⭐');
    
    // 查询订单表验证
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('commission_amount')
      .neq('status', 'rejected');
    
    const orderCommissionSum = orders.reduce((sum, o) => 
      sum + parseFloat(o.commission_amount || 0), 0);
    
    console.log('\\n订单表commission_amount总和:', orderCommissionSum.toFixed(2));
    
    console.log('\\n🎯 对比结果:');
    console.log('销售表待返佣金:', pendingCommission.toFixed(2));
    console.log('订单表佣金总和:', orderCommissionSum.toFixed(2));
    
    if (Math.abs(orderCommissionSum - 3276) < 1) {
      console.log('✅ 确认：订单表佣金总和 = 3276');
      if (pendingCommission === 0) {
        console.log('❌ 问题：销售表待返佣金 = 0');
        console.log('🔍 结论：API错误地使用了订单表数据！');
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库查询失败:', error);
  }
});
`;

console.log(testCode);

console.log('\n\n📝 测试步骤:');
console.log('1. 复制上面的代码到浏览器控制台');
console.log('2. 按回车执行');
console.log('3. 观察pending_commission的值');
console.log('4. 如果是3276，说明API有bug');
console.log('5. 如果是0，说明API正确');

console.log('\n🎯 预期结果:');
console.log('• 销售表待返佣金应该是0（所有佣金都已支付）');
console.log('• API返回的pending_commission应该是0');
console.log('• 如果API返回3276，说明错误地使用了订单表数据');