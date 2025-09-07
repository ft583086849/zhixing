// 检查数据库中订单时间和销售分类问题
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://mbqjkpqnjnrwzuafgqed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icWprcHFuam5yd3p1YWZncWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTg0NTgsImV4cCI6MjA0ODYzNDQ1OH0.d5xoIDAJx0TR4KnBiFiWSRGDZqCPcVdZBe0G2x2hVlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('========================================');
  console.log('🔍 数据库问题分析');
  console.log('========================================');
  
  // 1. 分析订单时间字段
  console.log('\n📅 1. 订单时间字段分析');
  console.log('----------------------------------------');
  
  try {
    // 获取所有订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('order_id, status, duration, payment_time, config_time, effective_time, expiry_time, sales_code')
      .order('created_at', { ascending: false });
    
    if (ordersError) throw ordersError;
    
    // 统计时间字段空值
    const stats = {
      total: orders.length,
      hasEffectiveTime: 0,
      hasExpiryTime: 0,
      hasConfigTime: 0,
      hasPaymentTime: 0,
      byStatus: {}
    };
    
    orders.forEach(order => {
      if (order.effective_time) stats.hasEffectiveTime++;
      if (order.expiry_time) stats.hasExpiryTime++;
      if (order.config_time) stats.hasConfigTime++;
      if (order.payment_time) stats.hasPaymentTime++;
      
      // 按状态分组
      if (!stats.byStatus[order.status]) {
        stats.byStatus[order.status] = {
          count: 0,
          hasEffective: 0,
          hasExpiry: 0
        };
      }
      stats.byStatus[order.status].count++;
      if (order.effective_time) stats.byStatus[order.status].hasEffective++;
      if (order.expiry_time) stats.byStatus[order.status].hasExpiry++;
    });
    
    console.log('总订单数:', stats.total);
    console.log('有生效时间:', stats.hasEffectiveTime, `(${(stats.hasEffectiveTime/stats.total*100).toFixed(1)}%)`);
    console.log('有到期时间:', stats.hasExpiryTime, `(${(stats.hasExpiryTime/stats.total*100).toFixed(1)}%)`);
    console.log('有配置时间:', stats.hasConfigTime, `(${(stats.hasConfigTime/stats.total*100).toFixed(1)}%)`);
    console.log('有支付时间:', stats.hasPaymentTime, `(${(stats.hasPaymentTime/stats.total*100).toFixed(1)}%)`);
    
    console.log('\n按状态分组:');
    Object.entries(stats.byStatus).forEach(([status, data]) => {
      console.log(`  ${status}:`);
      console.log(`    - 数量: ${data.count}`);
      console.log(`    - 有生效时间: ${data.hasEffective} (${(data.hasEffective/data.count*100).toFixed(1)}%)`);
      console.log(`    - 有到期时间: ${data.hasExpiry} (${(data.hasExpiry/data.count*100).toFixed(1)}%)`);
    });
    
    // 查看问题订单示例
    console.log('\n问题订单示例（无生效/到期时间）:');
    const problemOrders = orders.filter(o => !o.effective_time || !o.expiry_time).slice(0, 5);
    problemOrders.forEach(order => {
      console.log(`  订单${order.order_id}:`);
      console.log(`    状态: ${order.status}`);
      console.log(`    时长: ${order.duration}`);
      console.log(`    支付时间: ${order.payment_time || '无'}`);
      console.log(`    配置时间: ${order.config_time || '无'}`);
      console.log(`    生效时间: ${order.effective_time || '无'}`);
      console.log(`    到期时间: ${order.expiry_time || '无'}`);
    });
    
  } catch (error) {
    console.error('❌ 查询订单失败:', error);
  }
  
  // 2. 分析销售分类问题
  console.log('\n👥 2. 销售分类问题分析');
  console.log('----------------------------------------');
  
  try {
    // 获取所有销售
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*');
    
    if (salesError) throw salesError;
    
    // 统计销售类型
    const salesStats = {
      primary: [],
      secondary: [],
      secondaryWithParent: [],
      secondaryWithoutParent: [],
      independent: [],
      undefined: []
    };
    
    sales.forEach(sale => {
      if (sale.sales_type === 'primary') {
        salesStats.primary.push(sale);
      } else if (sale.sales_type === 'secondary') {
        salesStats.secondary.push(sale);
        
        // 检查是否有上级
        if (sale.parent_sales_code || sale.parent_sales_id || sale.primary_sales_id) {
          salesStats.secondaryWithParent.push(sale);
        } else {
          salesStats.secondaryWithoutParent.push(sale);
        }
      } else if (sale.sales_type === 'independent') {
        salesStats.independent.push(sale);
      } else {
        salesStats.undefined.push(sale);
      }
    });
    
    console.log('销售统计:');
    console.log('  一级销售:', salesStats.primary.length);
    console.log('  二级销售:', salesStats.secondary.length);
    console.log('    - 有上级:', salesStats.secondaryWithParent.length);
    console.log('    - 无上级:', salesStats.secondaryWithoutParent.length);
    console.log('  独立销售:', salesStats.independent.length);
    console.log('  未定义类型:', salesStats.undefined.length);
    
    // 显示无上级的二级销售
    if (salesStats.secondaryWithoutParent.length > 0) {
      console.log('\n⚠️ 无上级的二级销售（应该被判定为独立销售）:');
      salesStats.secondaryWithoutParent.forEach(sale => {
        console.log(`  ${sale.sales_code} (${sale.wechat_name}):`);
        console.log(`    parent_sales_code: ${sale.parent_sales_code || '空'}`);
        console.log(`    parent_sales_id: ${sale.parent_sales_id || '空'}`);
        console.log(`    primary_sales_id: ${sale.primary_sales_id || '空'}`);
        console.log(`    primary_sales_code: ${sale.primary_sales_code || '空'}`);
      });
    }
    
    // 检查有上级的二级销售
    console.log('\n有上级的二级销售示例:');
    salesStats.secondaryWithParent.slice(0, 3).forEach(sale => {
      console.log(`  ${sale.sales_code} (${sale.wechat_name}):`);
      console.log(`    parent_sales_code: ${sale.parent_sales_code || '空'}`);
      console.log(`    parent_sales_id: ${sale.parent_sales_id || '空'}`);
      console.log(`    primary_sales_id: ${sale.primary_sales_id || '空'}`);
    });
    
  } catch (error) {
    console.error('❌ 查询销售失败:', error);
  }
  
  // 3. 分析关联问题
  console.log('\n🔗 3. 订单与销售关联分析');
  console.log('----------------------------------------');
  
  try {
    // 获取二级销售的订单
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select(`
        order_id,
        sales_code,
        sales_optimized!inner(
          sales_code,
          sales_type,
          wechat_name,
          parent_sales_code,
          parent_sales_id,
          primary_sales_id
        )
      `)
      .eq('sales_optimized.sales_type', 'secondary')
      .limit(10);
    
    if (error) throw error;
    
    console.log('二级销售订单示例:');
    orders.forEach(order => {
      const sale = order.sales_optimized;
      const hasParent = sale.parent_sales_code || sale.parent_sales_id || sale.primary_sales_id;
      console.log(`  订单 ${order.order_id}:`);
      console.log(`    销售: ${sale.sales_code} (${sale.wechat_name})`);
      console.log(`    类型: ${sale.sales_type}`);
      console.log(`    有上级: ${hasParent ? '是' : '否'}`);
      if (!hasParent) {
        console.log(`    ⚠️ 此订单的销售将被显示为"独立销售"`);
      }
    });
    
  } catch (error) {
    console.error('❌ 查询关联失败:', error);
  }
  
  console.log('\n========================================');
  console.log('📋 修复建议');
  console.log('========================================');
  console.log('1. 时间字段问题:');
  console.log('   - 需要批量更新历史订单的effective_time和expiry_time');
  console.log('   - 建议根据config_time和duration重新计算');
  console.log('\n2. 销售分类问题:');
  console.log('   - 需要修复无上级的二级销售数据');
  console.log('   - 统一使用parent_sales_code作为上级关系字段');
  console.log('   - 修改前端判断逻辑，正确识别销售类型');
}

// 执行分析
analyzeDatabase().catch(console.error);