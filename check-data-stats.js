const SupabaseService = require('./client/src/services/supabase.js');

async function checkData() {
  try {
    // Get orders
    const { data: orders } = await SupabaseService.supabase.from('orders').select('*');
    if (!orders) {
      console.log('No orders found');
      return;
    }
    console.log('📊 订单总数:', orders.length);
    
    // Count by status
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    console.log('📊 订单状态分布:', statusCount);
    
    // Get valid orders (excluding rejected)
    const validOrders = orders.filter(o => o.status !== 'rejected');
    console.log('✅ 生效订单数:', validOrders.length);
    
    // Get confirmed orders
    const confirmedOrders = orders.filter(o => 
      ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
    );
    console.log('✅ 已确认订单数:', confirmedOrders.length);
    
    // Calculate commission
    let totalCommission = 0;
    confirmedOrders.forEach(order => {
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      // Assuming 25% average commission rate
      totalCommission += amountUSD * 0.25;
    });
    console.log('💰 预计总佣金: $', totalCommission.toFixed(2));
    
    // Get sales data
    const { data: primarySales } = await SupabaseService.supabase.from('primary_sales').select('*');
    const { data: secondarySales } = await SupabaseService.supabase.from('secondary_sales').select('*');
    console.log('👥 一级销售数:', primarySales.length);
    console.log('👥 二级销售数:', secondarySales.length);
    
    // Get top sales by orders
    const salesOrders = {};
    orders.forEach(order => {
      if (order.sales_code) {
        if (!salesOrders[order.sales_code]) {
          salesOrders[order.sales_code] = {
            count: 0,
            amount: 0,
            sales_code: order.sales_code
          };
        }
        salesOrders[order.sales_code].count++;
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        salesOrders[order.sales_code].amount += amountUSD;
      }
    });
    
    // Sort by amount and get top 5
    const topSales = Object.values(salesOrders)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    console.log('🏆 Top 5 销售:');
    topSales.forEach((sale, index) => {
      console.log(`  ${index + 1}. ${sale.sales_code}: $${sale.amount.toFixed(2)} (${sale.count}订单)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkData();