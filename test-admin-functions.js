#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// 正确的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminFunctions() {
  console.log('🔍 测试管理后台功能...\n');

  try {
    // 1. 测试获取统计数据
    console.log('📊 1. 获取统计数据:');
    const today = new Date().toISOString().split('T')[0];
    const { data: ordersToday, error: ordersTodayError } = await supabase
      .from('orders_optimized')
      .select('*')
      .gte('created_at', today)
      .lte('created_at', today + 'T23:59:59');

    if (ordersTodayError) {
      console.log('  ❌ 今日订单查询失败:', ordersTodayError.message);
    } else {
      console.log('  ✅ 今日订单数:', ordersToday.length);
    }

    // 2. 测试获取销售列表
    console.log('\n👥 2. 获取销售列表:');
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (salesError) {
      console.log('  ❌ 销售列表查询失败:', salesError.message);
    } else {
      console.log('  ✅ 获取到销售记录:', sales.length, '条');
      if (sales.length > 0) {
        console.log('  示例销售员:', sales[0].wechat_name || sales[0].sales_code);
        console.log('  销售类型:', sales[0].sales_type);
        console.log('  佣金率:', sales[0].commission_rate);
      }
    }

    // 3. 测试获取订单列表
    console.log('\n📋 3. 获取订单列表:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select(`
        *,
        sales:sales_optimized!inner(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.log('  ❌ 订单列表查询失败:', ordersError.message);
    } else {
      console.log('  ✅ 获取到订单记录:', orders.length, '条');
      if (orders.length > 0) {
        console.log('  示例订单ID:', orders[0].order_id);
        console.log('  客户微信:', orders[0].customer_wechat);
        console.log('  订单状态:', orders[0].status);
        console.log('  订单金额:', orders[0].amount);
      }
    }

    // 4. 测试一级销售统计
    console.log('\n💰 4. 一级销售统计:');
    const { data: primarySales, error: primaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary')
      .limit(5);

    if (primaryError) {
      console.log('  ❌ 一级销售查询失败:', primaryError.message);
    } else {
      console.log('  ✅ 一级销售数量:', primarySales.length);
      
      // 计算待返佣金
      for (const sale of primarySales.slice(0, 2)) {
        const { data: pendingOrders, error: pendingError } = await supabase
          .from('orders_optimized')
          .select('amount, commission_amount')
          .eq('sales_code', sale.sales_code)
          .eq('status', 'confirmed_payment');

        if (!pendingError && pendingOrders) {
          const pendingCommission = pendingOrders.reduce((sum, order) => 
            sum + (order.commission_amount || order.amount * sale.commission_rate), 0);
          console.log(`  销售员 ${sale.wechat_name}: 待返佣金 ￥${pendingCommission.toFixed(2)}`);
        }
      }
    }

    // 5. 测试二级销售统计
    console.log('\n👥 5. 二级销售统计:');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'secondary')
      .limit(5);

    if (secondaryError) {
      console.log('  ❌ 二级销售查询失败:', secondaryError.message);
    } else {
      console.log('  ✅ 二级销售数量:', secondarySales.length);
      if (secondarySales.length > 0) {
        console.log('  示例二级销售:', secondarySales[0].wechat_name);
        console.log('  上级销售代码:', secondarySales[0].parent_sales_code);
      }
    }

    console.log('\n✅ 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testAdminFunctions();