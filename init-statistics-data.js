const SupabaseService = require('./client/src/services/supabase.js');

async function initStatisticsData() {
  console.log('🚀 开始初始化统计表数据...\n');
  
  const supabase = SupabaseService.supabase;
  
  try {
    // 1. 获取基础数据
    console.log('📊 获取基础数据...');
    const [orders, primarySales, secondarySales] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('primary_sales').select('*'),
      supabase.from('secondary_sales').select('*')
    ]);
    
    console.log(`✅ 获取到 ${orders.data?.length || 0} 个订单`);
    console.log(`✅ 获取到 ${primarySales.data?.length || 0} 个一级销售`);
    console.log(`✅ 获取到 ${secondarySales.data?.length || 0} 个二级销售\n`);
    
    // 2. 初始化overview_stats表
    console.log('📈 初始化overview_stats表...');
    
    const ordersData = orders.data || [];
    const validOrders = ordersData.filter(o => o.status !== 'rejected');
    const confirmedOrders = ordersData.filter(o => o.status === 'confirmed_config');
    
    const overviewStats = {
      stat_type: 'realtime',
      stat_period: 'all',
      total_orders: ordersData.length,
      valid_orders: validOrders.length,
      rejected_orders: ordersData.filter(o => o.status === 'rejected').length,
      pending_payment_orders: ordersData.filter(o => o.status === 'pending_payment').length,
      pending_config_orders: ordersData.filter(o => o.status === 'pending_config').length,
      confirmed_config_orders: confirmedOrders.length,
      total_amount: ordersData.reduce((sum, o) => sum + (o.amount || 0), 0),
      confirmed_amount: confirmedOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      primary_sales_count: primarySales.data?.length || 0,
      secondary_sales_count: secondarySales.data?.length || 0,
      last_calculated_at: new Date().toISOString()
    };
    
    const { error: statsError } = await supabase
      .from('overview_stats')
      .upsert(overviewStats, { onConflict: 'stat_type,stat_period' });
      
    if (statsError) {
      console.error('❌ overview_stats初始化失败:', statsError);
    } else {
      console.log('✅ overview_stats初始化成功');
    }
    
    // 3. 初始化sales_statistics表
    console.log('\n💰 初始化sales_statistics表...');
    
    // 处理一级销售统计
    for (const sale of (primarySales.data || [])) {
      const saleOrders = ordersData.filter(o => o.primary_sales_id === sale.id);
      const validSaleOrders = saleOrders.filter(o => o.status !== 'rejected');
      const confirmedSaleOrders = saleOrders.filter(o => o.status === 'confirmed_config');
      
      const salesStat = {
        sales_id: sale.id,
        sales_type: 'primary',
        sales_code: sale.sales_code,
        total_orders: saleOrders.length,
        valid_orders: validSaleOrders.length,
        total_amount: saleOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        confirmed_amount: confirmedSaleOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        commission_rate: sale.commission_rate || 40,
        commission_amount: confirmedSaleOrders.reduce((sum, o) => 
          sum + ((o.amount || 0) * (sale.commission_rate || 40) / 100), 0
        ),
        last_updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('sales_statistics')
        .upsert(salesStat, { onConflict: 'sales_id,sales_type' });
        
      if (!error) {
        console.log(`✅ 一级销售 ${sale.sales_code} 统计数据初始化成功`);
      }
    }
    
    // 处理二级销售统计
    for (const sale of (secondarySales.data || [])) {
      const saleOrders = ordersData.filter(o => o.secondary_sales_id === sale.id);
      const validSaleOrders = saleOrders.filter(o => o.status !== 'rejected');
      const confirmedSaleOrders = saleOrders.filter(o => o.status === 'confirmed_config');
      
      const salesStat = {
        sales_id: sale.id,
        sales_type: 'secondary',
        sales_code: sale.sales_code,
        total_orders: saleOrders.length,
        valid_orders: validSaleOrders.length,
        total_amount: saleOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        confirmed_amount: confirmedSaleOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        commission_rate: sale.commission_rate || 25,
        commission_amount: confirmedSaleOrders.reduce((sum, o) => 
          sum + ((o.amount || 0) * (sale.commission_rate || 25) / 100), 0
        ),
        last_updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('sales_statistics')
        .upsert(salesStat, { onConflict: 'sales_id,sales_type' });
        
      if (!error) {
        console.log(`✅ 二级销售 ${sale.sales_code} 统计数据初始化成功`);
      }
    }
    
    // 4. 初始化commission_records表
    console.log('\n💵 初始化commission_records表...');
    
    let commissionCount = 0;
    for (const order of confirmedOrders) {
      if (order.primary_sales_id) {
        const sale = primarySales.data.find(s => s.id === order.primary_sales_id);
        if (sale) {
          const commission = {
            order_id: order.id,
            order_number: order.order_number,
            order_amount: order.amount,
            sales_id: sale.id,
            sales_type: 'primary',
            sales_code: sale.sales_code,
            sales_name: sale.wechat_name,
            commission_rate: sale.commission_rate || 40,
            commission_amount: (order.amount || 0) * (sale.commission_rate || 40) / 100,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          
          await supabase.from('commission_records').upsert(commission);
          commissionCount++;
        }
      }
      
      if (order.secondary_sales_id) {
        const sale = secondarySales.data.find(s => s.id === order.secondary_sales_id);
        if (sale) {
          const commission = {
            order_id: order.id,
            order_number: order.order_number,
            order_amount: order.amount,
            sales_id: sale.id,
            sales_type: 'secondary',
            sales_code: sale.sales_code,
            sales_name: sale.wechat_name,
            commission_rate: sale.commission_rate || 25,
            commission_amount: (order.amount || 0) * (sale.commission_rate || 25) / 100,
            status: 'pending',
            is_secondary: true,
            parent_sales_id: sale.primary_sales_id,
            created_at: new Date().toISOString()
          };
          
          await supabase.from('commission_records').upsert(commission);
          commissionCount++;
        }
      }
    }
    
    console.log(`✅ 创建了 ${commissionCount} 条佣金记录`);
    
    // 5. 初始化finance_daily_stats表（最近30天）
    console.log('\n📅 初始化finance_daily_stats表...');
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = ordersData.filter(o => 
        o.created_at && o.created_at.startsWith(dateStr)
      );
      
      if (dayOrders.length > 0) {
        const dailyStat = {
          stat_date: dateStr,
          total_orders: dayOrders.length,
          valid_orders: dayOrders.filter(o => o.status !== 'rejected').length,
          total_revenue: dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
          confirmed_revenue: dayOrders
            .filter(o => o.status === 'confirmed_config')
            .reduce((sum, o) => sum + (o.amount || 0), 0),
          created_at: new Date().toISOString()
        };
        
        await supabase
          .from('finance_daily_stats')
          .upsert(dailyStat, { onConflict: 'stat_date' });
      }
    }
    
    console.log('✅ 财务日统计表初始化成功');
    
    console.log('\n🎉 所有统计表初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
  
  process.exit(0);
}

initStatisticsData();