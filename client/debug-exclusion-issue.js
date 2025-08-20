#!/usr/bin/env node

/**
 * 调试排除功能无效的问题
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExclusion() {
  console.log('🔍 调试排除功能问题\n');
  
  try {
    // 1. 检查排除表是否存在数据
    console.log('1️⃣ 检查排除配置表...');
    const { data: excludedList, error: excludedError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('is_active', true);
    
    if (excludedError) {
      console.error('❌ 查询排除表失败:', excludedError.message);
      console.log('   可能原因: 表不存在或权限问题');
      return;
    }
    
    console.log('✅ 排除名单:', excludedList);
    
    if (!excludedList || excludedList.length === 0) {
      console.log('⚠️ 排除名单为空！');
      console.log('   请先在收款配置页面添加要排除的销售');
      return;
    }
    
    const excludedSalesCodes = excludedList
      .filter(item => item.sales_code)
      .map(item => item.sales_code);
    
    console.log('📝 排除的销售代码:', excludedSalesCodes);
    
    // 2. 检查wangming是否在sales_optimized表中
    console.log('\n2️⃣ 检查wangming在销售表中的数据...');
    const { data: wangmingSales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'wangming');
    
    if (salesError) {
      console.error('❌ 查询销售表失败:', salesError.message);
      return;
    }
    
    if (wangmingSales && wangmingSales.length > 0) {
      console.log('✅ 找到wangming的销售记录:');
      wangmingSales.forEach(sale => {
        console.log(`   - 销售代码: ${sale.sales_code}`);
        console.log(`     类型: ${sale.sales_type}`);
        console.log(`     佣金: ${sale.total_commission || 0}`);
        console.log(`     订单数: ${sale.order_count || 0}`);
      });
      
      const wangmingCodes = wangmingSales.map(s => s.sales_code);
      const isExcluded = wangmingCodes.some(code => excludedSalesCodes.includes(code));
      
      if (isExcluded) {
        console.log('✅ wangming的销售代码在排除列表中');
      } else {
        console.log('❌ wangming的销售代码不在排除列表中！');
        console.log('   需要添加销售代码:', wangmingCodes);
      }
    } else {
      console.log('⚠️ 未找到wangming的销售记录');
    }
    
    // 3. 检查wangming的订单
    console.log('\n3️⃣ 检查wangming的订单...');
    if (wangmingSales && wangmingSales.length > 0) {
      const wangmingCodes = wangmingSales.map(s => s.sales_code);
      
      for (const code of wangmingCodes) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders_optimized')
          .select('id, amount, actual_payment_amount, status, sales_code')
          .eq('sales_code', code);
        
        if (!ordersError && orders) {
          console.log(`   销售代码 ${code} 的订单数: ${orders.length}`);
          
          // 计算总金额
          let totalAmount = 0;
          orders.forEach(order => {
            if (order.status !== 'rejected') {
              const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
              totalAmount += amount;
            }
          });
          
          console.log(`   订单总金额: ${totalAmount}`);
        }
      }
    }
    
    // 4. 测试API调用
    console.log('\n4️⃣ 测试API排除逻辑...');
    console.log('请在浏览器控制台执行以下代码：');
    console.log(`
import('/src/services/api.js').then(module => {
  const AdminAPI = module.AdminAPI;
  
  // 测试不排除的情况
  AdminAPI.getStats({ skipExclusion: true }).then(stats1 => {
    console.log('不排除时的统计:', {
      总收入: stats1.total_amount,
      销售返佣: stats1.total_commission
    });
    
    // 测试排除的情况
    AdminAPI.getStats({ skipExclusion: false }).then(stats2 => {
      console.log('排除后的统计:', {
        总收入: stats2.total_amount,
        销售返佣: stats2.total_commission
      });
      
      console.log('差额:', {
        收入差: stats1.total_amount - stats2.total_amount,
        佣金差: stats1.total_commission - stats2.total_commission
      });
    });
  });
});
    `);
    
    console.log('\n5️⃣ 可能的问题：');
    console.log('1. 排除名单中填写的是微信号，但实际需要的是销售代码');
    console.log('2. 排除配置表中的sales_code字段为空');
    console.log('3. 缓存问题导致数据未更新');
    console.log('4. 权限问题导致表查询失败');
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugExclusion();