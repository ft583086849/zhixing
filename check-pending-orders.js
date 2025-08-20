/**
 * 检查待审批订单问题
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPendingOrders() {
  console.log('========================================');
  console.log('检查待审批订单');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    // 1. 检查orders表中的待审批订单
    console.log('【1. orders表待审批订单】');
    console.log('----------------------------------------');
    
    const { data: ordersPending, error: ordersError } = await supabase
      .from('orders')
      .select('id, tradingview_username, status, created_at, sales_code')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (ordersPending && ordersPending.length > 0) {
      console.log(`发现 ${ordersPending.length} 个待审批订单：`);
      ordersPending.forEach(order => {
        console.log(`  ID ${order.id}: ${order.tradingview_username} - ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log(`    销售: ${order.sales_code || '无'}`);
      });
    } else {
      console.log('✅ 没有待审批订单');
    }

    // 2. 检查orders_optimized表中的待审批订单
    console.log('\n【2. orders_optimized表待审批订单】');
    console.log('----------------------------------------');
    
    const { data: optimizedPending, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, status, created_at, sales_code')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (optimizedPending && optimizedPending.length > 0) {
      console.log(`发现 ${optimizedPending.length} 个待审批订单：`);
      optimizedPending.forEach(order => {
        console.log(`  ID ${order.id}: ${order.tradingview_username} - ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log(`    销售: ${order.sales_code || '无'}`);
      });
    } else {
      console.log('✅ 没有待审批订单');
    }

    // 3. 对比两表差异
    console.log('\n【3. 数据对比】');
    console.log('----------------------------------------');
    
    if (ordersPending && optimizedPending) {
      const ordersIds = ordersPending.map(o => o.id);
      const optimizedIds = optimizedPending.map(o => o.id);
      
      const onlyInOrders = ordersIds.filter(id => !optimizedIds.includes(id));
      const onlyInOptimized = optimizedIds.filter(id => !ordersIds.includes(id));
      
      if (onlyInOrders.length > 0) {
        console.log(`❌ 只在orders表中的待审批订单ID: ${onlyInOrders.join(', ')}`);
        console.log('这些订单需要同步到orders_optimized表！');
      }
      
      if (onlyInOptimized.length > 0) {
        console.log(`⚠️ 只在orders_optimized表中的待审批订单ID: ${onlyInOptimized.join(', ')}`);
      }
      
      if (onlyInOrders.length === 0 && onlyInOptimized.length === 0) {
        console.log('✅ 两表待审批订单一致');
      }
    }

    // 4. 检查所有状态分布
    console.log('\n【4. 订单状态分布】');
    console.log('----------------------------------------');
    
    const { data: statusCount } = await supabase
      .from('orders_optimized')
      .select('status');
    
    const statusMap = {};
    statusCount?.forEach(row => {
      statusMap[row.status || 'null'] = (statusMap[row.status || 'null'] || 0) + 1;
    });
    
    Object.entries(statusMap).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 个`);
    });

    // 5. 建议
    console.log('\n========================================');
    console.log('问题分析与建议');
    console.log('========================================\n');
    
    if (ordersPending && ordersPending.length > 0 && (!optimizedPending || optimizedPending.length === 0)) {
      console.log('❌ 严重问题：orders表有待审批订单，但orders_optimized表没有！');
      console.log('\n需要立即：');
      console.log('1. 同步这些待审批订单到orders_optimized表');
      console.log('2. 确保页面从正确的表读取数据');
    } else if (ordersPending && optimizedPending && ordersPending.length !== optimizedPending.length) {
      console.log('⚠️ 两表待审批订单数量不一致');
      console.log('需要同步数据');
    } else {
      console.log('✅ 数据状态正常');
    }

  } catch (error) {
    console.error('查询出错:', error.message);
  }
}

// 执行检查
checkPendingOrders();