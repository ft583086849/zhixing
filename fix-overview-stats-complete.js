const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function fixOverviewStats() {
  console.log('Fixing overview_stats table...');
  
  // Delete existing incomplete entries
  const { error: deleteError } = await supabase
    .from('overview_stats')
    .delete()
    .is('period', null);
  
  if (deleteError) {
    console.log('Delete error:', deleteError);
  } else {
    console.log('Deleted entries with null period');
  }

  // Get all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*');

  if (ordersError) {
    console.log('Orders error:', ordersError);
    return;
  }

  console.log('Found', orders.length, 'orders');

  // Get all sales
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*');

  if (salesError) {
    console.log('Sales error:', salesError);
    return;
  }

  console.log('Found', sales.length, 'sales');

  // Calculate statistics
  const stats = {
    period: 'all',
    total_orders: orders.length,
    pending_payment_orders: 0,
    pending_config_orders: 0, 
    confirmed_config_orders: 0,
    rejected_orders: 0,
    valid_orders: 0,
    total_amount: 0,
    total_commission: 0,
    pending_commission: 0,
    commission_amount: 0,
    pending_commission_amount: 0,
    free_trial_orders: 0,
    free_trial_percentage: 0,
    one_month_orders: 0,
    one_month_percentage: 0,
    three_month_orders: 0,
    three_month_percentage: 0,
    six_month_orders: 0,
    six_month_percentage: 0,
    yearly_orders: 0,
    yearly_percentage: 0,
    primary_sales_count: 0,
    primary_sales_amount: 0,
    linked_secondary_sales_count: 0,
    linked_secondary_sales_amount: 0,
    independent_sales_count: 0,
    independent_sales_amount: 0
  };

  // Track unique sales
  const primarySales = new Map();
  const linkedSecondarySales = new Map();
  const independentSales = new Map();

  orders.forEach(order => {
    // Count by payment status
    if (order.payment_status === 'pending_payment' || order.payment_status === 'pending') {
      stats.pending_payment_orders++;
    } else if (order.payment_status === 'paid') {
      stats.valid_orders++;
      const orderAmount = order.amount || order.actual_payment_amount || 0;
      stats.total_amount += orderAmount;
      const commissionAmount = order.commission_amount || 0;
      stats.total_commission += commissionAmount;
      stats.commission_amount += commissionAmount;
      
      // Track by sales type
      if (order.sales_type === 'primary') {
        const salesId = order.primary_sales_id;
        if (salesId) {
          if (!primarySales.has(salesId)) {
            primarySales.set(salesId, 0);
          }
          primarySales.set(salesId, primarySales.get(salesId) + orderAmount);
        }
      } else if (order.sales_type === 'secondary') {
        const salesId = order.secondary_sales_id;
        if (salesId) {
          if (order.primary_sales_id) {
            // Linked secondary
            if (!linkedSecondarySales.has(salesId)) {
              linkedSecondarySales.set(salesId, 0);
            }
            linkedSecondarySales.set(salesId, linkedSecondarySales.get(salesId) + orderAmount);
          } else {
            // Independent secondary
            if (!independentSales.has(salesId)) {
              independentSales.set(salesId, 0);
            }
            independentSales.set(salesId, independentSales.get(salesId) + orderAmount);
          }
        }
      }
      
      // Count by config status
      if (order.config_confirmed === true) {
        stats.confirmed_config_orders++;
      } else if (order.config_confirmed === false || order.config_confirmed === null) {
        stats.pending_config_orders++;
      }
    } else if (order.payment_status === 'rejected') {
      stats.rejected_orders++;
    }
    
    // Count by duration/product type (count all orders, not just paid)
    const duration = order.duration || '';
    if (duration.includes('7天') || duration.includes('7日') || duration.includes('free') || duration === '7_days') {
      stats.free_trial_orders++;
    } else if (duration.includes('1个月') || duration.includes('1月') || duration === '1_month') {
      stats.one_month_orders++;
    } else if (duration.includes('3个月') || duration.includes('3月') || duration === '3_month') {
      stats.three_month_orders++;
    } else if (duration.includes('6个月') || duration.includes('6月') || duration === '6_month') {
      stats.six_month_orders++;
    } else if (duration.includes('年') || duration.includes('1年') || duration === 'yearly' || duration === '1_year') {
      stats.yearly_orders++;
    }
  });

  // Calculate from sales table for more accurate counts
  sales.forEach(sale => {
    if (sale.sales_type === 'primary') {
      if (!primarySales.has(sale.id)) {
        primarySales.set(sale.id, 0);
      }
    } else if (sale.sales_type === 'secondary') {
      if (sale.primary_sales_id) {
        if (!linkedSecondarySales.has(sale.id)) {
          linkedSecondarySales.set(sale.id, 0);
        }
      } else {
        if (!independentSales.has(sale.id)) {
          independentSales.set(sale.id, 0);
        }
      }
    }
  });

  // Calculate percentages based on total orders (not just valid)
  const totalOrdersForPercentage = stats.total_orders || 1;
  stats.free_trial_percentage = (stats.free_trial_orders / totalOrdersForPercentage * 100);
  stats.one_month_percentage = (stats.one_month_orders / totalOrdersForPercentage * 100);
  stats.three_month_percentage = (stats.three_month_orders / totalOrdersForPercentage * 100);
  stats.six_month_percentage = (stats.six_month_orders / totalOrdersForPercentage * 100);
  stats.yearly_percentage = (stats.yearly_orders / totalOrdersForPercentage * 100);

  // Set sales counts and amounts
  stats.primary_sales_count = primarySales.size;
  stats.primary_sales_amount = Array.from(primarySales.values()).reduce((sum, amt) => sum + amt, 0);
  stats.linked_secondary_sales_count = linkedSecondarySales.size;
  stats.linked_secondary_sales_amount = Array.from(linkedSecondarySales.values()).reduce((sum, amt) => sum + amt, 0);
  stats.independent_sales_count = independentSales.size;
  stats.independent_sales_amount = Array.from(independentSales.values()).reduce((sum, amt) => sum + amt, 0);

  // Also calculate pending commission
  stats.pending_commission_amount = stats.total_commission; // Assuming all commissions are pending for now

  console.log('Calculated stats:', JSON.stringify(stats, null, 2));

  // Delete any existing 'all' period entry
  const { error: deleteAllError } = await supabase
    .from('overview_stats')
    .delete()
    .eq('period', 'all');

  if (deleteAllError) {
    console.log('Delete all period error:', deleteAllError);
  }

  // Insert the new stats
  const { data, error } = await supabase
    .from('overview_stats')
    .insert([stats]);

  if (error) {
    console.log('Insert error:', error);
  } else {
    console.log('Successfully updated overview_stats');
    
    // Verify the insert
    const { data: verifyData, error: verifyError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('period', 'all')
      .single();
    
    if (verifyError) {
      console.log('Verify error:', verifyError);
    } else {
      console.log('Verified data in database:', {
        period: verifyData.period,
        total_orders: verifyData.total_orders,
        valid_orders: verifyData.valid_orders,
        total_amount: verifyData.total_amount,
        primary_sales_count: verifyData.primary_sales_count,
        free_trial_orders: verifyData.free_trial_orders
      });
    }
  }
}

fixOverviewStats().catch(console.error);