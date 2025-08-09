/**
 * 检查所有销售数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllSales() {
  console.log('🔍 检查所有销售数据...\n');

  // 1. 检查一级销售
  const { data: primarySales, error: primaryError } = await supabase
    .from('primary_sales')
    .select('*');

  if (primaryError) {
    console.error('查询一级销售失败:', primaryError);
  } else {
    console.log(`📊 一级销售总数: ${primarySales?.length || 0}`);
    if (primarySales && primarySales.length > 0) {
      console.log('一级销售列表:');
      primarySales.forEach(sale => {
        console.log(`\n[${sale.id}] ${sale.wechat_name || sale.name}`);
        console.log(`  - sales_code: ${sale.sales_code}`);
        console.log(`  - chain_name: ${sale.chain_name || '未设置'}`);
        console.log(`  - payment_method: ${sale.payment_method || '未设置'}`);
        console.log(`  - payment_account: ${sale.payment_account || '未设置'}`);
        console.log(`  - commission_rate: ${sale.commission_rate}`);
      });
    }
  }

  // 2. 检查二级销售
  const { data: secondarySales, error: secondaryError } = await supabase
    .from('secondary_sales')
    .select('*');

  if (secondaryError) {
    console.error('查询二级销售失败:', secondaryError);
  } else {
    console.log(`\n📊 二级销售总数: ${secondarySales?.length || 0}`);
    if (secondarySales && secondarySales.length > 0) {
      console.log('二级销售列表:');
      secondarySales.forEach(sale => {
        console.log(`\n[${sale.id}] ${sale.wechat_name || sale.name}`);
        console.log(`  - sales_code: ${sale.sales_code}`);
        console.log(`  - primary_sales_id: ${sale.primary_sales_id || '独立销售'}`);
        console.log(`  - chain_name: ${sale.chain_name || '未设置'}`);
        console.log(`  - payment_method: ${sale.payment_method || '未设置'}`);
        console.log(`  - payment_account: ${sale.payment_account || '未设置'}`);
        console.log(`  - commission_rate: ${sale.commission_rate}`);
      });
    }
  }

  // 3. 检查订单
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(5);

  if (ordersError) {
    console.error('查询订单失败:', ordersError);
  } else {
    console.log(`\n📊 订单总数（显示前5条）:`);
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        console.log(`\n订单 ${order.id}:`);
        console.log(`  - customer: ${order.customer_wechat}`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - status: ${order.status}`);
      });
    }
  }
}

checkAllSales().catch(console.error);
