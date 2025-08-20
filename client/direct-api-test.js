#!/usr/bin/env node

/**
 * 直接测试API返回的pending_commission值
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiDirectly() {
  console.log('🔍 直接测试API返回的pending_commission值\n');
  
  try {
    // 1. 先验证数据库中的实际待返佣金
    console.log('1️⃣ 验证数据库中的实际待返佣金:');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('wechat_name, total_commission, paid_commission');
    
    let dbPendingTotal = 0;
    let salesWithPending = [];
    
    if (sales) {
      sales.forEach(sale => {
        const total = parseFloat(sale.total_commission || 0);
        const paid = parseFloat(sale.paid_commission || 0);
        const pending = total - paid;
        
        dbPendingTotal += pending;
        
        if (pending > 0) {
          salesWithPending.push({
            name: sale.wechat_name,
            total,
            paid,
            pending
          });
        }
      });
    }
    
    console.log(`   数据库实际待返佣金: ${dbPendingTotal.toFixed(2)} 元`);
    if (salesWithPending.length > 0) {
      console.log('   有待返佣金的销售:');
      salesWithPending.forEach(s => {
        console.log(`   • ${s.name}: 待返 ${s.pending.toFixed(2)} 元`);
      });
    } else {
      console.log('   ✅ 确认：所有销售的佣金都已支付（待返=0）');
    }
    
    // 2. 检查订单表的commission_amount总和
    console.log('\n2️⃣ 检查订单表的commission_amount总和:');
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('commission_amount')
      .neq('status', 'rejected');
    
    const orderCommissionSum = orders?.reduce((sum, o) => 
      sum + parseFloat(o.commission_amount || 0), 0) || 0;
    
    console.log(`   订单表commission_amount总和: ${orderCommissionSum.toFixed(2)} 元`);
    
    // 3. 模拟API的getSales调用
    console.log('\n3️⃣ 模拟API的getSales调用:');
    const { data: salesData } = await supabase
      .from('sales_optimized')  
      .select('*');
    
    let total_commission = 0;
    let paid_commission = 0;
    let pending_commission = 0;
    
    if (salesData) {
      salesData.forEach(sale => {
        const commissionAmount = sale.total_commission || sale.commission_amount || 0;
        const paidAmount = sale.paid_commission || 0;
        const pendingAmount = commissionAmount - paidAmount;
        
        total_commission += commissionAmount;
        paid_commission += paidAmount;
        pending_commission += pendingAmount;
      });
    }
    
    console.log(`   模拟API计算结果:`);
    console.log(`   • total_commission: ${total_commission.toFixed(2)}`);
    console.log(`   • paid_commission: ${paid_commission.toFixed(2)}`);
    console.log(`   • pending_commission: ${pending_commission.toFixed(2)} ⭐`);
    
    // 4. 分析结果
    console.log('\n4️⃣ 分析结果:');
    
    if (Math.abs(pending_commission) < 0.01) {
      console.log('   ✅ API应该返回pending_commission = 0');
    } else {
      console.log(`   ❌ API可能返回pending_commission = ${pending_commission.toFixed(2)}`);
    }
    
    if (Math.abs(orderCommissionSum - 3276) < 1) {
      console.log('   ⚠️ 订单表commission_amount总和 ≈ 3276');
      console.log('   这可能是页面显示3276的原因');
    }
    
    // 5. 检查是否有其他数据源
    console.log('\n5️⃣ 检查可能的错误数据源:');
    
    // 检查是否有缓存或其他统计表
    try {
      const { data: overviewStats } = await supabase
        .from('overview_stats')
        .select('*')
        .limit(1);
      
      if (overviewStats && overviewStats.length > 0) {
        console.log('   发现overview_stats表，可能是数据源');
        console.log('   overview_stats数据:', overviewStats[0]);
      }
    } catch (e) {
      console.log('   overview_stats表不存在或无权限');
    }
    
    // 6. 总结
    console.log('\n6️⃣ 总结:');
    console.log('   数据库状态：所有佣金已支付，待返佣金=0');
    console.log('   预期API返回：pending_commission=0');
    console.log('   可能的错误：某处使用了订单表的commission_amount(3276)');
    
    console.log('\n📋 下一步行动:');
    console.log('   1. 在浏览器中测试实际API调用');
    console.log('   2. 如果API返回3276，检查api.js中的计算逻辑');
    console.log('   3. 如果API返回0，检查前端组件的显示逻辑');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testApiDirectly();