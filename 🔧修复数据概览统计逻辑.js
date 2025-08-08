// 🔧 修复数据概览统计逻辑
// 运行方式：node 🔧修复数据概览统计逻辑.js

const { createClient } = require('@supabase/supabase-js');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function calculateStats() {
  console.log('🔧 计算正确的统计数据...\n');
  console.log('=====================================\n');

  try {
    // 1. 获取所有订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
      return;
    }
    
    console.log(`📊 总订单数: ${orders.length}`);
    
    // 2. 获取销售数据
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('*');
    
    console.log(`👥 一级销售数: ${primarySales?.length || 0}`);
    console.log(`👥 二级销售数: ${secondarySales?.length || 0}`);
    console.log('');
    
    // 3. 计算订单统计
    const stats = {
      // 基础订单统计
      total_orders: orders.length,
      pending_payment_orders: orders.filter(o => 
        ['pending_payment', 'pending', 'pending_review'].includes(o.status)
      ).length,
      pending_config_orders: orders.filter(o => 
        o.status === 'pending_config'
      ).length,
      confirmed_config_orders: orders.filter(o => 
        ['confirmed_configuration', 'active'].includes(o.status)
      ).length,
    };
    
    // 4. 计算金额统计
    let total_amount = 0;
    let commission_amount = 0;
    let primary_sales_amount = 0;
    let secondary_sales_amount = 0;
    
    // 为每个订单计算佣金和归属
    orders.forEach(order => {
      const amount = parseFloat(order.amount || 0);
      total_amount += amount;
      
      // 根据销售代码判断订单归属
      if (order.sales_code) {
        // 查找是一级还是二级销售
        const isPrimarySale = primarySales?.some(ps => ps.sales_code === order.sales_code);
        const isSecondarySale = secondarySales?.some(ss => ss.sales_code === order.sales_code);
        
        if (isPrimarySale) {
          // 一级销售的订单
          primary_sales_amount += amount;
          // 一级销售默认40%佣金
          commission_amount += amount * 0.4;
        } else if (isSecondarySale) {
          // 二级销售的订单
          secondary_sales_amount += amount;
          // 查找二级销售的佣金率
          const sale = secondarySales.find(ss => ss.sales_code === order.sales_code);
          const commissionRate = sale?.commission_rate || 0.3; // 默认30%
          commission_amount += amount * commissionRate;
        }
      }
    });
    
    // 5. 整理最终统计数据
    const finalStats = {
      ...stats,
      total_amount: Math.round(total_amount * 100) / 100,
      
      // 佣金相关（修正字段名）
      commission_amount: Math.round(commission_amount * 100) / 100,  // 销售返佣金额
      pending_commission_amount: 0,  // 待返佣金金额（暂时为0）
      
      // 销售统计
      primary_sales_count: primarySales?.length || 0,
      secondary_sales_count: secondarySales?.length || 0,
      
      // 销售业绩（新增）
      primary_sales_amount: Math.round(primary_sales_amount * 100) / 100,  // 一级销售业绩
      secondary_sales_amount: Math.round(secondary_sales_amount * 100) / 100,  // 二级销售业绩
    };
    
    console.log('📈 计算出的统计数据:');
    console.log('=====================================');
    console.log('订单统计:');
    console.log(`  总订单数: ${finalStats.total_orders}`);
    console.log(`  待付款确认: ${finalStats.pending_payment_orders}`);
    console.log(`  待配置确认: ${finalStats.pending_config_orders}`);
    console.log(`  已配置确认: ${finalStats.confirmed_config_orders}`);
    console.log('');
    console.log('金额统计:');
    console.log(`  总收入: $${finalStats.total_amount}`);
    console.log(`  销售返佣金额: $${finalStats.commission_amount}`);
    console.log(`  待返佣金金额: $${finalStats.pending_commission_amount}`);
    console.log('');
    console.log('销售统计:');
    console.log(`  一级销售总数: ${finalStats.primary_sales_count}`);
    console.log(`  二级销售总数: ${finalStats.secondary_sales_count}`);
    console.log(`  一级销售业绩: $${finalStats.primary_sales_amount}`);
    console.log(`  二级销售业绩: $${finalStats.secondary_sales_amount}`);
    console.log('=====================================\n');
    
    // 6. 显示每个销售的详细业绩
    console.log('📊 销售详细业绩:');
    console.log('-------------------------------------');
    
    // 统计每个销售的业绩
    const salesPerformance = {};
    
    orders.forEach(order => {
      if (order.sales_code) {
        if (!salesPerformance[order.sales_code]) {
          salesPerformance[order.sales_code] = {
            orders: 0,
            amount: 0,
            commission: 0
          };
        }
        salesPerformance[order.sales_code].orders++;
        salesPerformance[order.sales_code].amount += parseFloat(order.amount || 0);
      }
    });
    
    // 计算佣金
    Object.keys(salesPerformance).forEach(salesCode => {
      const isPrimary = primarySales?.some(ps => ps.sales_code === salesCode);
      const isSecondary = secondarySales?.some(ss => ss.sales_code === salesCode);
      
      if (isPrimary) {
        salesPerformance[salesCode].commission = salesPerformance[salesCode].amount * 0.4;
        salesPerformance[salesCode].type = '一级销售';
      } else if (isSecondary) {
        const sale = secondarySales.find(ss => ss.sales_code === salesCode);
        const rate = sale?.commission_rate || 0.3;
        salesPerformance[salesCode].commission = salesPerformance[salesCode].amount * rate;
        salesPerformance[salesCode].type = '二级销售';
      }
    });
    
    // 显示结果
    Object.entries(salesPerformance).forEach(([code, perf]) => {
      console.log(`${code} (${perf.type || '未知'}):`);
      console.log(`  订单数: ${perf.orders}`);
      console.log(`  业绩: $${perf.amount.toFixed(2)}`);
      console.log(`  佣金: $${perf.commission.toFixed(2)}`);
      console.log('');
    });
    
    return finalStats;
    
  } catch (error) {
    console.error('❌ 计算过程出错:', error);
  }
}

// 执行计算
calculateStats();

