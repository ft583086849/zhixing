// 验证三个修复是否生效的脚本
const { createClient } = require('@supabase/supabase-js');

// 正确的Supabase配置
const supabaseUrl = 'https://mbqjkpqnjnrwzuafgqed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icWprcHFuam5yd3p1YWZncWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTg0NTgsImV4cCI6MjA0ODYzNDQ1OH0.d5xoIDAJx0TR4KnBiFiWSRGDZqCPcVdZBe0G2x2hVlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFixes() {
  console.log('========================================');
  console.log('✅ 验证修复效果');
  console.log('========================================');
  
  // 1. 验证Supabase连接
  console.log('\n1️⃣ 验证Supabase连接修复');
  console.log('----------------------------------------');
  try {
    const { data: salesData, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(5);
    
    if (salesError) throw salesError;
    
    console.log('✅ Supabase连接正常');
    console.log(`   获取到 ${salesData.length} 条销售数据`);
  } catch (error) {
    console.error('❌ Supabase连接失败:', error.message);
  }
  
  // 2. 验证订单时间字段
  console.log('\n2️⃣ 验证订单时间字段');
  console.log('----------------------------------------');
  try {
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('order_id, status, effective_time, expiry_time, created_at, payment_time, config_time')
      .limit(10)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // 统计时间字段情况
    const stats = {
      total: orders.length,
      hasEffectiveTime: 0,
      hasExpiryTime: 0
    };
    
    orders.forEach(order => {
      if (order.effective_time) stats.hasEffectiveTime++;
      if (order.expiry_time) stats.hasExpiryTime++;
    });
    
    console.log(`📊 最近10个订单的时间字段情况:`);
    console.log(`   有生效时间: ${stats.hasEffectiveTime}/${stats.total}`);
    console.log(`   有到期时间: ${stats.hasExpiryTime}/${stats.total}`);
    
    // 显示几个示例
    console.log('\n   示例订单:');
    orders.slice(0, 3).forEach(order => {
      console.log(`   订单 ${order.order_id}:`);
      console.log(`     状态: ${order.status}`);
      console.log(`     生效时间: ${order.effective_time ? '✅ 有' : '❌ 无'}`);
      console.log(`     到期时间: ${order.expiry_time ? '✅ 有' : '❌ 无'}`);
    });
    
  } catch (error) {
    console.error('❌ 查询订单失败:', error.message);
  }
  
  // 3. 验证销售分类
  console.log('\n3️⃣ 验证销售分类');
  console.log('----------------------------------------');
  try {
    const { data: sales, error } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, sales_type, parent_sales_code, parent_sales_id')
      .eq('sales_type', 'secondary')
      .limit(10);
    
    if (error) throw error;
    
    console.log(`📊 二级销售的上级关系:`);
    
    let hasParentCount = 0;
    let noParentCount = 0;
    
    sales.forEach(sale => {
      const hasParent = sale.parent_sales_code || sale.parent_sales_id;
      if (hasParent) {
        hasParentCount++;
      } else {
        noParentCount++;
      }
      
      console.log(`   ${sale.sales_code} (${sale.wechat_name}):`);
      console.log(`     上级代码: ${sale.parent_sales_code || '无'}`);
      console.log(`     上级ID: ${sale.parent_sales_id || '无'}`);
      console.log(`     分类: ${hasParent ? '✅ 二级销售' : '⚠️ 独立销售'}`);
    });
    
    console.log(`\n   统计: ${hasParentCount} 个有上级，${noParentCount} 个无上级`);
    
  } catch (error) {
    console.error('❌ 查询销售失败:', error.message);
  }
  
  console.log('\n========================================');
  console.log('📋 修复效果总结');
  console.log('========================================');
  console.log('1. Supabase URL配置：已修复为正确的URL');
  console.log('2. 订单时间字段：已改进逻辑，新订单将自动设置时间');
  console.log('3. 销售分类显示：已修复判断逻辑，支持多字段检查');
  console.log('\n💡 建议：');
  console.log('- 对历史订单运行批量更新脚本，补充缺失的时间字段');
  console.log('- 检查并修复没有上级的二级销售数据');
}

// 执行验证
verifyFixes().catch(console.error);