#!/usr/bin/env node

/**
 * 追踪pending_commission的值变化
 */

console.log('🔍 追踪pending_commission的值变化\n');

console.log('请在浏览器控制台执行以下代码：\n');

const traceCode = `
// 修改getStats方法，添加详细的追踪日志
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  // 保存原始方法
  const originalGetStats = AdminAPI.getStats;
  
  // 替换为追踪版本
  AdminAPI.getStats = async function(params) {
    console.log('\\n🔍 开始追踪getStats执行...');
    console.log('参数:', params);
    
    // 在原方法中插入追踪代码
    const originalGetSales = this.getSales;
    let pendingCommissionTrace = [];
    
    // 临时替换getSales来追踪
    this.getSales = async function(salesParams) {
      console.log('  调用getSales，参数:', salesParams);
      const result = await originalGetSales.call(this, salesParams);
      
      // 计算待返佣金
      let totalPending = 0;
      if (Array.isArray(result)) {
        result.forEach(sale => {
          const pending = (sale.total_commission || 0) - (sale.paid_commission || 0);
          if (pending !== 0) {
            console.log('    销售', sale.wechat_name, '待返:', pending);
          }
          totalPending += pending;
        });
      }
      console.log('  getSales计算的总待返:', totalPending);
      pendingCommissionTrace.push({ source: 'getSales', value: totalPending });
      
      return result;
    };
    
    // 执行原方法
    const stats = await originalGetStats.call(this, params);
    
    // 恢复原方法
    this.getSales = originalGetSales;
    
    console.log('\\n📊 最终返回的stats:');
    console.log('  total_commission:', stats.total_commission);
    console.log('  paid_commission:', stats.paid_commission);
    console.log('  pending_commission:', stats.pending_commission, '⭐');
    console.log('  pending_commission_amount:', stats.pending_commission_amount);
    
    // 检查是否等于3276
    if (stats.pending_commission === 3276) {
      console.log('\\n❌ 错误！pending_commission = 3276');
      console.log('这不应该是订单的commission_amount总和！');
      
      // 查询订单表验证
      import('/src/services/supabase.js').then(m => {
        const supabase = m.default.supabase;
        supabase.from('orders_optimized')
          .select('commission_amount')
          .neq('status', 'rejected')
          .then(({ data }) => {
            if (data) {
              const sum = data.reduce((t, o) => t + parseFloat(o.commission_amount || 0), 0);
              console.log('\\n订单表commission_amount总和:', sum);
              if (sum === 3276) {
                console.log('⚠️ 确认：错误地使用了订单表的commission_amount！');
              }
            }
          });
      });
    }
    
    console.log('\\n追踪历史:', pendingCommissionTrace);
    
    return stats;
  };
  
  // 执行测试
  console.log('\\n🚀 开始测试...');
  AdminAPI.getStats({ timeRange: 'all' }).then(result => {
    console.log('\\n✅ 测试完成');
  });
});
`;

console.log(traceCode);

console.log('\n📝 关键检查点：');
console.log('1. getSales返回的待返佣金总和');
console.log('2. getStats最终返回的pending_commission值');
console.log('3. 是否等于3276（订单表的commission_amount总和）');
console.log('\n如果pending_commission = 3276，说明代码有bug！');