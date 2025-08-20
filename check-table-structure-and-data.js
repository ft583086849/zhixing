const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTableAndData() {
  console.log('=== Checking Table Structure and Data ===\n');
  
  // 1. First, let's check if orders_optimized table exists and get sample data
  console.log('1. Checking orders_optimized table:\n');
  const { data: optimizedSample, error: optimizedError } = await supabase
    .from('orders_optimized')
    .select('*')
    .limit(1);
    
  if (optimizedError) {
    console.log('Error with orders_optimized:', optimizedError.message);
    console.log('\nTrying orders table instead...\n');
    
    // 2. Check orders table
    const { data: ordersSample, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
      
    if (ordersError) {
      console.log('Error with orders table:', ordersError.message);
    } else if (ordersSample && ordersSample.length > 0) {
      console.log('Orders table columns:');
      console.log(Object.keys(ordersSample[0]).join(', '));
    }
  } else if (optimizedSample && optimizedSample.length > 0) {
    console.log('orders_optimized table columns:');
    console.log(Object.keys(optimizedSample[0]).join(', '));
  }
  
  // 3. Get recent orders from the correct table
  console.log('\n\n2. Recent Orders Data:\n');
  const { data: recentOrders, error: recentError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (recentError) {
    console.log('Error fetching recent orders:', recentError.message);
  } else if (recentOrders && recentOrders.length > 0) {
    console.log(`Found ${recentOrders.length} recent orders:\n`);
    recentOrders.forEach(order => {
      console.log(`ID: ${order.id}`);
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
  
  // 4. Check today's orders
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n\n3. Today's Orders (${today}):\n`);
  
  const { data: todayOrders, error: todayError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');
    
  if (todayError) {
    console.log('Error fetching today orders:', todayError.message);
  } else if (todayOrders && todayOrders.length > 0) {
    console.log(`Found ${todayOrders.length} orders today:\n`);
    todayOrders.forEach(order => {
      console.log(`ID: ${order.id}`);
      console.log(`  Customer: ${order.customer_name} (${order.buyer_code})`);
      console.log(`  Sales: ${order.sales_code}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: ${order.amount}`);
      console.log(`  Actual Payment: ${order.actual_payment_amount || 'null'}`);
      console.log('---');
    });
    
    // Summary
    console.log('\nSummary by Sales:');
    const salesSummary = {};
    todayOrders.forEach(order => {
      const sales = order.sales_code || 'No Sales';
      if (!salesSummary[sales]) {
        salesSummary[sales] = {
          count: 0,
          customers: []
        };
      }
      salesSummary[sales].count++;
      salesSummary[sales].customers.push(order.customer_name || order.buyer_code);
    });
    
    Object.entries(salesSummary).forEach(([sales, data]) => {
      console.log(`  ${sales}: ${data.count} orders`);
      console.log(`    Customers: ${data.customers.join(', ')}`);
    });
  } else {
    console.log('No orders found today');
  }
  
  // 5. Check orders with actual_payment_amount > 0
  console.log('\n\n4. Orders with Payments (actual_payment_amount > 0):\n');
  const { data: paidOrders, error: paidError } = await supabase
    .from('orders')
    .select('*')
    .gt('actual_payment_amount', 0)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (paidError) {
    console.log('Error fetching paid orders:', paidError.message);
  } else if (paidOrders && paidOrders.length > 0) {
    console.log(`Found ${paidOrders.length} orders with payments:\n`);
    paidOrders.forEach(order => {
      console.log(`ID: ${order.id}`);
      console.log(`  Date: ${order.created_at}`);
      console.log(`  Customer: ${order.customer_name} (${order.buyer_code})`);
      console.log(`  Sales: ${order.sales_code}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Actual Payment: ${order.actual_payment_amount}`);
      console.log('---');
    });
  } else {
    console.log('No orders with payments found');
  }
}

checkTableAndData().catch(console.error);