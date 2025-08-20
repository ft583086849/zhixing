#!/usr/bin/env node

/**
 * 综合测试所有页面的佣金显示
 */

console.log('🧪 综合测试所有页面的佣金显示\n');

console.log('请在浏览器控制台执行以下代码：\n');

const testCode = `
console.log('🔍 开始测试所有页面的佣金统计...');

// 1. 测试数据概览页面
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('\\n📊 1. 数据概览页面 (AdminOverview):');
  
  AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
    console.log('getStats返回的原始数据:');
    console.log('  total_commission:', stats.total_commission);
    console.log('  commission_amount:', stats.commission_amount);
    console.log('  pending_commission:', stats.pending_commission);
    console.log('  pending_commission_amount:', stats.pending_commission_amount);
    console.log('  paid_commission:', stats.paid_commission);
    console.log('  paid_commission_amount:', stats.paid_commission_amount);
    
    console.log('\\n页面显示逻辑:');
    console.log('  销售返佣金额 = stats.total_commission || stats.commission_amount =', 
                stats.total_commission || stats.commission_amount || 0);
    console.log('  待返佣金额 = stats.pending_commission || stats.pending_commission_amount =', 
                stats.pending_commission || stats.pending_commission_amount || 0);
    
    // 检查是否有其他字段
    console.log('\\n检查其他可能的字段:');
    Object.keys(stats).forEach(key => {
      if (key.includes('commission') || key.includes('佣金')) {
        console.log('  ', key, ':', stats[key]);
      }
    });
  });
});

// 2. 测试资金统计页面
setTimeout(() => {
  console.log('\\n💰 2. 资金统计页面 (AdminFinance):');
  
  import('/src/components/admin/AdminFinance.js').then(module => {
    console.log('AdminFinance组件已加载');
    // 资金统计通常也使用getStats
  }).catch(err => {
    console.log('无法直接导入组件，通过API测试');
  });
  
  // 资金统计页面也用getStats
  import('/src/services/api.js').then(module => {
    const AdminAPI = module.AdminAPI;
    
    // 检查是否有单独的getFinanceStats方法
    if (AdminAPI.getFinanceStats) {
      AdminAPI.getFinanceStats({ timeRange: 'all' }).then(stats => {
        console.log('getFinanceStats返回:', stats);
      });
    } else {
      console.log('资金统计使用相同的getStats方法');
    }
  });
}, 1000);

// 3. 测试销售管理页面
setTimeout(() => {
  console.log('\\n👥 3. 销售管理页面 (AdminSales):');
  
  import('/src/services/api.js').then(module => {
    const AdminAPI = module.AdminAPI;
    
    AdminAPI.getSales({}).then(sales => {
      // 手动计算汇总
      let totalSalesAmount = 0;
      let totalCommission = 0;
      let totalPaid = 0;
      let totalPending = 0;
      
      sales.forEach(sale => {
        totalSalesAmount += (sale.total_sales_amount || 0);
        totalCommission += (sale.total_commission || 0);
        totalPaid += (sale.paid_commission || 0);
      });
      
      totalPending = totalCommission - totalPaid;
      
      console.log('销售管理页面汇总:');
      console.log('  总销售额:', totalSalesAmount);
      console.log('  应返佣金:', totalCommission);
      console.log('  已返佣金:', totalPaid);
      console.log('  待返佣金:', totalPending);
      console.log('  销售人数:', sales.length);
      
      // 检查排除效果
      const hasWangming = sales.some(s => s.wechat_name === 'wangming');
      console.log('  包含wangming:', hasWangming);
    });
  });
}, 2000);

// 4. 直接查询数据库验证
setTimeout(() => {
  console.log('\\n🗄️ 4. 直接从数据库计算（用于对比）:');
  
  // 从订单表计算
  import('/src/services/supabase.js').then(module => {
    const SupabaseService = module.default;
    const supabase = SupabaseService.supabase;
    
    // 查询订单表
    supabase.from('orders_optimized')
      .select('commission_amount, status')
      .neq('status', 'rejected')
      .then(({ data: orders }) => {
        if (orders) {
          const totalCommissionAmount = orders.reduce((sum, o) => 
            sum + parseFloat(o.commission_amount || 0), 0);
          
          console.log('订单表commission_amount总和:', totalCommissionAmount);
          console.log('  如果显示为美元:', totalCommissionAmount, '美元');
          console.log('  如果是人民币转美元:', (totalCommissionAmount / 7.15).toFixed(2), '美元');
        }
      });
    
    // 查询销售表
    supabase.from('sales_optimized')
      .select('total_commission, paid_commission')
      .then(({ data: sales }) => {
        if (sales) {
          const totalCommission = sales.reduce((sum, s) => 
            sum + parseFloat(s.total_commission || 0), 0);
          const totalPaid = sales.reduce((sum, s) => 
            sum + parseFloat(s.paid_commission || 0), 0);
          
          console.log('销售表应返佣金总和:', totalCommission);
          console.log('销售表已返佣金总和:', totalPaid);
          console.log('销售表待返佣金(应返-已返):', totalCommission - totalPaid);
        }
      });
  });
}, 3000);

console.log('\\n⏳ 测试正在运行，请等待结果...');
`;

console.log(testCode);

console.log('\n📝 问题分析：');
console.log('1. 订单表的commission_amount总和 = 3276（人民币）');
console.log('2. 页面显示待返佣金 = 3276美元');
console.log('3. 销售表显示所有佣金都已返还（待返=0）');
console.log('\n可能的原因：');
console.log('• API错误地返回了订单的commission_amount作为待返佣金');
console.log('• 单位转换错误（把人民币当成美元）');
console.log('• 销售表和订单表的数据不一致');

console.log('\n✅ 正确的逻辑应该是：');
console.log('• 待返佣金 = 销售表的(total_commission - paid_commission)的总和');
console.log('• 如果销售表显示都已返还，待返佣金应该是0');
console.log('• 排除功能应该同时影响所有统计');