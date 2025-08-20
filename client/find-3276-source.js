#!/usr/bin/env node

/**
 * 查找3276这个数字的来源
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function find3276Source() {
  console.log('🔍 查找3276这个数字的来源\n');
  
  try {
    // 1. 检查订单表的各种佣金字段
    console.log('1️⃣ 订单表的佣金字段统计:');
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected');
    
    if (orders) {
      // 统计各个佣金字段
      let commission_amount_sum = 0;
      let primary_commission_sum = 0;
      let secondary_commission_sum = 0;
      let confirmed_orders_commission = 0;
      let pending_orders_commission = 0;
      
      orders.forEach(order => {
        const ca = parseFloat(order.commission_amount || 0);
        const pc = parseFloat(order.primary_commission_amount || 0);
        const sc = parseFloat(order.secondary_commission_amount || 0);
        
        commission_amount_sum += ca;
        primary_commission_sum += pc;
        secondary_commission_sum += sc;
        
        // 按状态分组
        if (['confirmed', 'confirmed_config', 'active'].includes(order.status)) {
          confirmed_orders_commission += ca;
        } else {
          pending_orders_commission += ca;
        }
      });
      
      console.log(`   commission_amount总和: ${commission_amount_sum} ⭐`);
      console.log(`   primary_commission_amount总和: ${primary_commission_sum}`);
      console.log(`   secondary_commission_amount总和: ${secondary_commission_sum}`);
      console.log(`   确认订单的commission: ${confirmed_orders_commission}`);
      console.log(`   未确认订单的commission: ${pending_orders_commission}`);
      
      if (commission_amount_sum === 3276) {
        console.log('\n   ✅ 找到了！commission_amount总和 = 3276');
      }
    }
    
    // 2. 检查销售表
    console.log('\n2️⃣ 销售表的佣金统计:');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('*');
    
    if (sales) {
      let total_commission = 0;
      let paid_commission = 0;
      let pending_commission = 0;
      
      console.log('   各销售的佣金详情:');
      sales.forEach(sale => {
        const tc = parseFloat(sale.total_commission || 0);
        const pc = parseFloat(sale.paid_commission || 0);
        const pending = tc - pc;
        
        total_commission += tc;
        paid_commission += pc;
        pending_commission += pending;
        
        console.log(`   ${sale.wechat_name}: 应返=${tc}, 已返=${pc}, 待返=${pending}`);
      });
      
      console.log(`\n   汇总:`);
      console.log(`   应返佣金总和: ${total_commission}`);
      console.log(`   已返佣金总和: ${paid_commission}`);
      console.log(`   待返佣金总和: ${pending_commission} ⭐`);
      
      if (pending_commission === 0) {
        console.log('\n   ⚠️ 销售表显示待返佣金=0，但页面显示3276！');
      }
    }
    
    // 3. 直接测试API
    console.log('\n3️⃣ 测试API返回值:');
    console.log('请在浏览器控制台执行:');
    console.log(`
// 直接调试getStats方法
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  // 在getStats内部打印调试信息
  const originalGetStats = AdminAPI.getStats;
  AdminAPI.getStats = async function(params) {
    console.log('🔍 getStats调用，参数:', params);
    const result = await originalGetStats.call(this, params);
    console.log('📊 getStats返回值:', result);
    
    // 检查pending_commission的值
    console.log('\\n关键字段:');
    console.log('  pending_commission:', result.pending_commission);
    console.log('  pending_commission_amount:', result.pending_commission_amount);
    console.log('  total_commission:', result.total_commission);
    console.log('  paid_commission:', result.paid_commission);
    
    // 验证计算
    const calculated = (result.total_commission || 0) - (result.paid_commission || 0);
    console.log('\\n验证: total - paid =', calculated);
    console.log('实际pending_commission =', result.pending_commission);
    
    if (result.pending_commission === 3276) {
      console.log('\\n❌ 错误！pending_commission不应该是3276');
      console.log('这个值来自订单表的commission_amount，不是销售表的待返佣金');
    }
    
    return result;
  };
  
  // 调用测试
  AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
    console.log('\\n最终结果:', stats);
  });
});
    `);
    
    // 4. 分析问题
    console.log('\n4️⃣ 问题分析:');
    console.log('• 订单表commission_amount总和 = 3276');
    console.log('• 销售表待返佣金总和 = 0');
    console.log('• 页面显示待返佣金 = 3276');
    console.log('\n结论: API可能错误地使用了订单表的commission_amount作为待返佣金！');
    
  } catch (error) {
    console.error('❌ 查找失败:', error);
  }
}

find3276Source();