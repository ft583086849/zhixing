#!/usr/bin/env node

/**
 * 全面检查所有页面的佣金统计
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllCommissionStats() {
  console.log('🔍 全面检查所有页面的佣金统计\n');
  
  try {
    // 1. 获取wangming的数据
    console.log('1️⃣ wangming的数据:');
    const { data: wangmingSales } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'wangming');
    
    if (wangmingSales && wangmingSales.length > 0) {
      const sale = wangmingSales[0];
      console.log(`   销售代码: ${sale.sales_code}`);
      console.log(`   应返佣金: ${sale.total_commission || 0}`);
      console.log(`   已返佣金: ${sale.paid_commission || 0}`);
      console.log(`   待返佣金: ${(sale.total_commission || 0) - (sale.paid_commission || 0)}`);
    }
    
    // 2. 检查所有销售的佣金总和
    console.log('\n2️⃣ 所有销售的佣金统计:');
    const { data: allSales } = await supabase
      .from('sales_optimized')
      .select('wechat_name, sales_code, total_commission, paid_commission');
    
    let totalCommission = 0;
    let totalPaid = 0;
    let totalPending = 0;
    
    if (allSales) {
      allSales.forEach(sale => {
        const commission = sale.total_commission || 0;
        const paid = sale.paid_commission || 0;
        const pending = commission - paid;
        
        totalCommission += commission;
        totalPaid += paid;
        totalPending += pending;
        
        if (pending > 0) {
          console.log(`   ${sale.wechat_name}: 应返=${commission}, 已返=${paid}, 待返=${pending}`);
        }
      });
    }
    
    console.log('\n   总计:');
    console.log(`   应返佣金总额: ${totalCommission}`);
    console.log(`   已返佣金总额: ${totalPaid}`);
    console.log(`   待返佣金总额: ${totalPending}`);
    
    // 3. 测试各个页面的API
    console.log('\n3️⃣ 测试各页面API的排除效果:');
    console.log('\n请在浏览器控制台执行以下代码：\n');
    
    const testCode = `
// 测试所有页面的佣金统计
console.log('🔍 检查各页面的佣金统计...');

// 1. 数据概览 (AdminOverview)
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('\\n📊 数据概览统计:');
  AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
    console.log('  销售返佣金额:', stats.total_commission || stats.commission_amount);
    console.log('  待返佣金额:', stats.pending_commission || stats.pending_commission_amount);
    console.log('  已返佣金额:', stats.paid_commission);
  });
});

// 2. 资金统计 (AdminFinance)
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('\\n💰 资金统计:');
  AdminAPI.getFinanceStats({ timeRange: 'all' }).then(stats => {
    console.log('  应返佣金:', stats.total_commission);
    console.log('  已返佣金:', stats.paid_commission);
    console.log('  待返佣金:', stats.pending_commission);
  }).catch(err => {
    console.log('  getFinanceStats可能不存在，使用getStats');
    AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
      console.log('  应返佣金:', stats.total_commission);
      console.log('  待返佣金:', stats.pending_commission);
    });
  });
});

// 3. 销售管理 (AdminSales)
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('\\n👥 销售管理:');
  AdminAPI.getSales({}).then(sales => {
    let totalSalesAmount = 0;
    let totalCommission = 0;
    let totalPending = 0;
    
    sales.forEach(sale => {
      totalSalesAmount += (sale.total_sales_amount || 0);
      totalCommission += (sale.total_commission || 0);
      const pending = (sale.total_commission || 0) - (sale.paid_commission || 0);
      totalPending += pending;
    });
    
    console.log('  总销售额:', totalSalesAmount);
    console.log('  应返佣金:', totalCommission);
    console.log('  待返佣金:', totalPending);
    console.log('  销售数量:', sales.length);
    
    // 检查是否包含wangming
    const hasWangming = sales.some(s => s.wechat_name === 'wangming');
    console.log('  包含wangming:', hasWangming ? '❌ 是(应该被排除)' : '✅ 否(已排除)');
  });
});

// 4. 检查待返佣金计算逻辑
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('\\n🔢 待返佣金计算对比:');
  
  // 获取销售数据手动计算
  AdminAPI.getSales({}).then(sales => {
    let manualPending = 0;
    sales.forEach(sale => {
      const pending = (sale.total_commission || 0) - (sale.paid_commission || 0);
      if (pending > 0) {
        console.log(\`  \${sale.wechat_name}: 待返=\${pending}\`);
        manualPending += pending;
      }
    });
    console.log('  手动计算待返总额:', manualPending);
  });
});
`;
    
    console.log(testCode);
    
    // 4. 分析待返佣金差异
    console.log('\n4️⃣ 待返佣金差异分析:');
    console.log('可能的原因:');
    console.log('1. 数据概览和销售管理使用不同的计算方法');
    console.log('2. 汇率转换问题（人民币/美元）');
    console.log('3. 某些页面没有应用排除过滤');
    console.log('4. 缓存导致数据不一致');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkAllCommissionStats();