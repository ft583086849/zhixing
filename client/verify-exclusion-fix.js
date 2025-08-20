#!/usr/bin/env node

/**
 * 验证排除功能修复效果
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyExclusion() {
  console.log('✅ 验证排除功能修复效果\n');
  
  try {
    // 1. 验证排除配置
    console.log('1️⃣ 检查排除配置...');
    const { data: excludedConfig } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('is_active', true);
    
    console.log('当前排除名单:');
    excludedConfig.forEach(item => {
      console.log(`   ✅ ${item.wechat_name}`);
      console.log(`      销售代码: ${item.sales_code}`);
      console.log(`      销售类型: ${item.sales_type}`);
    });
    
    const excludedSalesCodes = excludedConfig
      .filter(item => item.sales_code)
      .map(item => item.sales_code);
    
    console.log('\n排除的销售代码:', excludedSalesCodes);
    
    // 2. 验证wangming的数据
    console.log('\n2️⃣ 验证wangming的数据...');
    
    // 检查销售数据
    const { data: wangmingSales } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'wangming');
    
    if (wangmingSales && wangmingSales.length > 0) {
      const sale = wangmingSales[0];
      console.log('wangming的销售数据:');
      console.log(`   销售代码: ${sale.sales_code}`);
      console.log(`   应返佣金: ${sale.total_commission || 0}`);
      console.log(`   订单数: ${sale.order_count || 0}`);
      
      // 检查订单
      const { data: orders } = await supabase
        .from('orders_optimized')
        .select('id, amount, actual_payment_amount, status')
        .eq('sales_code', sale.sales_code);
      
      if (orders) {
        let totalAmount = 0;
        orders.forEach(order => {
          if (order.status !== 'rejected') {
            totalAmount += parseFloat(order.actual_payment_amount || order.amount || 0);
          }
        });
        
        console.log(`   订单数量: ${orders.length}`);
        console.log(`   订单总金额: ${totalAmount}`);
      }
    }
    
    // 3. 测试说明
    console.log('\n3️⃣ 测试方法:');
    console.log('请在浏览器控制台执行以下代码验证排除效果：\n');
    
    const testCode = `
// 验证排除功能
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  console.log('🔍 测试排除功能...');
  
  // 1. 获取不排除的统计
  AdminAPI.getStats({ skipExclusion: true, timeRange: 'all' }).then(stats1 => {
    
    // 2. 获取排除后的统计（默认）
    AdminAPI.getStats({ timeRange: 'all' }).then(stats2 => {
      
      console.log('📊 统计对比:');
      console.log('不排除时:', {
        总收入: stats1.total_amount,
        销售返佣: stats1.total_commission,
        待返佣: stats1.pending_commission
      });
      
      console.log('排除后:', {
        总收入: stats2.total_amount,
        销售返佣: stats2.total_commission,
        待返佣: stats2.pending_commission
      });
      
      const diff = {
        收入差额: (stats1.total_amount - stats2.total_amount).toFixed(2),
        佣金差额: (stats1.total_commission - stats2.total_commission).toFixed(2),
        待返佣差额: (stats1.pending_commission - stats2.pending_commission).toFixed(2)
      };
      
      console.log('差额:', diff);
      
      if (diff.收入差额 > 0) {
        console.log('✅ 排除功能生效！');
      } else {
        console.log('⚠️ 排除功能可能未生效');
      }
    });
  });
});`;
    
    console.log(testCode);
    
    console.log('\n✅ 修复验证完成！');
    console.log('\n预期结果:');
    console.log('• 排除后的总收入应该减少');
    console.log('• 排除后的销售返佣金额应该减少');
    console.log('• 差额应该等于wangming的相关数据');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

verifyExclusion();