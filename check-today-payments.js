const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTodayPayments() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Checking payments for today:', today);
  console.log('\n=== Checking orders_optimized table ===');
  
  // 1. Check all today's orders with payment
  const { data: todayOrders, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('*')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59')
    .gt('actual_payment_amount', 0)
    .order('created_at', { ascending: false });
    
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }
  
  console.log('\nFound', todayOrders?.length || 0, 'orders with payments today');
  
  if (todayOrders && todayOrders.length > 0) {
    console.log('\n=== Order Details ===');
    todayOrders.forEach(order => {
      console.log('\n---');
      console.log('Order ID:', order.order_id);
      console.log('Customer:', order.customer_name, '(' + order.buyer_code + ')');
      console.log('Sales:', order.sales_code);
      console.log('Status:', order.status);
      console.log('Payment Amount:', order.actual_payment_amount);
      console.log('Created At:', order.created_at);
      console.log('Chain Name:', order.chain_name);
    });
  }
  
  // 2. Check pending_payment status orders
  console.log('\n\n=== Checking pending_payment status orders ===');
  const { data: pendingOrders, error: pendingError } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('status', 'pending_payment')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (pendingError) {
    console.error('Error fetching pending orders:', pendingError);
    return;
  }
  
  console.log('\nFound', pendingOrders?.length || 0, 'orders with pending_payment status');
  
  if (pendingOrders && pendingOrders.length > 0) {
    console.log('\n=== Pending Payment Orders ===');
    pendingOrders.forEach(order => {
      console.log('\n---');
      console.log('Order ID:', order.order_id);
      console.log('Customer:', order.customer_name, '(' + order.buyer_code + ')');
      console.log('Sales:', order.sales_code);
      console.log('Payment Amount:', order.actual_payment_amount);
      console.log('Created At:', order.created_at);
    });
  }
  
  // 3. Summary of today's payments by sales
  console.log('\n\n=== Today\'s Payment Summary by Sales ===');
  const salesSummary = {};
  todayOrders?.forEach(order => {
    const sales = order.sales_code || 'No Sales';
    if (!salesSummary[sales]) {
      salesSummary[sales] = {
        count: 0,
        total: 0,
        customers: new Set()
      };
    }
    salesSummary[sales].count++;
    salesSummary[sales].total += order.actual_payment_amount || 0;
    salesSummary[sales].customers.add(order.customer_name || order.buyer_code);
  });
  
  Object.entries(salesSummary).forEach(([sales, data]) => {
    console.log('\nSales:', sales);
    console.log('  Orders:', data.count);
    console.log('  Total Amount:', data.total);
    console.log('  Customers:', Array.from(data.customers).join(', '));
  });
  
  // 4. Check all statuses to understand what's happening
  console.log('\n\n=== All Order Statuses Distribution ===');
  const { data: statusCount, error: statusError } = await supabase
    .from('orders_optimized')
    .select('status')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');
    
  if (!statusError && statusCount) {
    const statusSummary = {};
    statusCount.forEach(order => {
      const status = order.status || 'null';
      statusSummary[status] = (statusSummary[status] || 0) + 1;
    });
    
    Object.entries(statusSummary).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} orders`);
    });
  }
}

checkTodayPayments().catch(console.error);