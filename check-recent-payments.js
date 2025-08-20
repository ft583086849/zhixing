const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkRecentPayments() {
  console.log('=== Checking Recent Orders and Payments ===\n');
  
  // 1. Get last 20 orders with payments
  const { data: recentPayments, error: paymentsError } = await supabase
    .from('orders_optimized')
    .select('*')
    .gt('actual_payment_amount', 0)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (paymentsError) {
    console.error('Error fetching recent payments:', paymentsError);
    return;
  }
  
  console.log('Last 20 orders with payments:\n');
  if (recentPayments && recentPayments.length > 0) {
    recentPayments.forEach(order => {
      console.log(`Order: ${order.order_id}`);
      console.log(`  Date: ${order.created_at}`);
      console.log(`  Customer: ${order.customer_name} (${order.buyer_code})`);
      console.log(`  Sales: ${order.sales_code}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Payment: ${order.actual_payment_amount}`);
      console.log('---');
    });
  } else {
    console.log('No orders with payments found');
  }
  
  // 2. Get last 10 orders regardless of payment
  console.log('\n\n=== Last 10 Orders (Any Status) ===\n');
  const { data: recentOrders, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('order_id, created_at, customer_name, buyer_code, sales_code, status, actual_payment_amount, amount')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (ordersError) {
    console.error('Error fetching recent orders:', ordersError);
    return;
  }
  
  if (recentOrders && recentOrders.length > 0) {
    recentOrders.forEach(order => {
      console.log(`Order: ${order.order_id}`);
      console.log(`  Date: ${order.created_at}`);
      console.log(`  Customer: ${order.customer_name} (${order.buyer_code})`);
      console.log(`  Sales: ${order.sales_code}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: ${order.amount}`);
      console.log(`  Actual Payment: ${order.actual_payment_amount || 'null'}`);
      console.log('---');
    });
  } else {
    console.log('No orders found');
  }
  
  // 3. Check different payment-related statuses
  console.log('\n\n=== Orders by Payment-Related Status ===\n');
  const paymentStatuses = ['pending_payment', 'paid', 'completed', 'pending'];
  
  for (const status of paymentStatuses) {
    const { data: statusOrders, error } = await supabase
      .from('orders_optimized')
      .select('order_id')
      .eq('status', status)
      .limit(5);
      
    if (!error) {
      console.log(`${status}: ${statusOrders?.length || 0} orders found`);
      if (statusOrders && statusOrders.length > 0) {
        console.log(`  Sample IDs: ${statusOrders.slice(0, 3).map(o => o.order_id).join(', ')}`);
      }
    }
  }
}

checkRecentPayments().catch(console.error);