const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function createTestData() {
  console.log('🚀 创建测试数据...\n');
  
  try {
    // 1. 创建一级销售员
    console.log('1️⃣ 创建一级销售员...');
    const primarySales = {
      sales_code: 'WML792355703',
      wechat_name: '张三',
      phone: '13800138000',
      payment_method: '支付宝',
      payment_account: 'zhangsan@alipay.com',
      sales_type: 'primary',
      commission_rate: 0.4, // 40%
      total_orders: 0,
      total_amount: 0,
      total_commission: 0
    };
    
    const { data: salesData, error: salesError } = await supabase
      .from('sales_optimized')
      .upsert(primarySales, { onConflict: 'sales_code' })
      .select();
      
    if (salesError) {
      console.error('创建一级销售失败:', salesError);
      return;
    }
    console.log('✅ 创建一级销售成功:', salesData[0].sales_code);
    
    // 2. 创建二级销售员  
    console.log('\n2️⃣ 创建二级销售员...');
    const secondarySales = {
      sales_code: 'SEC888666999',
      wechat_name: '李四',
      phone: '13900139000',
      payment_method: '支付宝',
      payment_account: 'lisi@alipay.com',
      sales_type: 'secondary',
      parent_sales_code: 'WML792355703',
      commission_rate: 0.25, // 25%
      total_orders: 0,
      total_amount: 0,
      total_commission: 0
    };
    
    const { data: secData, error: secError } = await supabase
      .from('sales_optimized')
      .upsert(secondarySales, { onConflict: 'sales_code' })
      .select();
      
    if (secError) {
      console.error('创建二级销售失败:', secError);
      return;
    }
    console.log('✅ 创建二级销售成功:', secData[0].sales_code);
    
    // 3. 创建一级销售的订单
    console.log('\n3️⃣ 创建一级销售的订单...');
    const primaryOrder = {
      id: 261247,  // 使用数字ID
      order_number: 'ORD261247',
      sales_code: 'WML792355703',
      customer_name: '客户1',
      customer_wechat: 'customer001',
      tradingview_username: 'trader001',
      amount: 397,
      actual_payment_amount: 397,
      duration: '1个月',
      payment_method: '支付宝',
      payment_time: new Date().toISOString(),
      status: 'confirmed_config',
      commission_amount: 397 * 0.4, // 158.80
      primary_commission_amount: 0,
      config_time: new Date().toISOString(),
      config_confirmed: true,
      expiry_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders_optimized')
      .upsert(primaryOrder, { onConflict: 'id' })
      .select();
      
    if (orderError) {
      console.error('创建订单失败:', orderError);
      return;
    }
    console.log('✅ 创建一级销售订单成功: 261247, 金额: $397, 佣金: $158.80');
    
    // 4. 创建二级销售的订单
    console.log('\n4️⃣ 创建二级销售的订单...');
    const secondaryOrder = {
      id: 999001,  // 使用数字ID
      order_number: 'ORD999001',
      sales_code: 'SEC888666999',
      customer_name: '客户2',
      customer_wechat: 'customer002',
      tradingview_username: 'trader002',
      amount: 500,
      actual_payment_amount: 500,
      duration: '3个月',
      payment_method: 'USDT',
      payment_time: new Date().toISOString(),
      status: 'confirmed_config',
      commission_amount: 500 * 0.25, // 125
      primary_commission_amount: 500 * 0.15, // 75 (一级销售分成)
      config_time: new Date().toISOString(),
      config_confirmed: true,
      expiry_time: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const { data: secOrderData, error: secOrderError } = await supabase
      .from('orders_optimized')
      .upsert(secondaryOrder, { onConflict: 'id' })
      .select();
      
    if (secOrderError) {
      console.error('创建二级订单失败:', secOrderError);
      return;
    }
    console.log('✅ 创建二级销售订单成功: 999001, 金额: $500');
    console.log('   二级销售佣金: $125, 一级销售分成: $75');
    
    // 5. 创建需要催单的订单
    console.log('\n5️⃣ 创建需要催单的订单...');
    const reminderOrder = {
      id: 888001,  // 使用数字ID
      order_number: 'ORD888001',
      sales_code: 'WML792355703',
      customer_name: '客户3',
      customer_wechat: 'customer003',
      tradingview_username: 'trader003',
      amount: 200,
      actual_payment_amount: 200,
      duration: '1个月',
      payment_method: '支付宝',
      payment_time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25天前付款
      status: 'confirmed_config',
      commission_amount: 200 * 0.4, // 80
      primary_commission_amount: 0,
      config_time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      config_confirmed: true,
      expiry_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天后到期
    };
    
    const { data: reminderData, error: reminderError } = await supabase
      .from('orders_optimized')
      .upsert(reminderOrder, { onConflict: 'id' })
      .select();
      
    if (reminderError) {
      console.error('创建催单订单失败:', reminderError);
      return;
    }
    console.log('✅ 创建催单订单成功: 888001 (5天后到期，需要催单)');
    
    // 6. 更新销售统计
    console.log('\n6️⃣ 更新销售统计...');
    
    // 更新一级销售统计
    const primaryStats = {
      sales_code: 'WML792355703',
      total_orders: 2, // fl261247 + reminder_001
      total_amount: 597, // 397 + 200
      total_commission: 397 * 0.4 + 200 * 0.4 + 500 * 0.15, // 158.80 + 80 + 75 = 313.80
    };
    
    const { error: updatePrimaryError } = await supabase
      .from('sales_optimized')
      .update(primaryStats)
      .eq('sales_code', 'WML792355703');
      
    if (updatePrimaryError) {
      console.error('更新一级销售统计失败:', updatePrimaryError);
    } else {
      console.log('✅ 更新一级销售统计: 总订单2个, 总金额$597, 总佣金$313.80');
    }
    
    // 更新二级销售统计
    const secondaryStats = {
      sales_code: 'SEC888666999',
      total_orders: 1,
      total_amount: 500,
      total_commission: 125,
    };
    
    const { error: updateSecError } = await supabase
      .from('sales_optimized')
      .update(secondaryStats)
      .eq('sales_code', 'SEC888666999');
      
    if (updateSecError) {
      console.error('更新二级销售统计失败:', updateSecError);
    } else {
      console.log('✅ 更新二级销售统计: 总订单1个, 总金额$500, 总佣金$125');
    }
    
    console.log('\n✅ 测试数据创建完成！');
    console.log('\n📊 数据总览:');
    console.log('一级销售 WML792355703:');
    console.log('  - 直接订单: 2个 ($597)');
    console.log('  - 直接佣金: $238.80 (40%)');
    console.log('  - 二级分成: $75 (15%)');
    console.log('  - 总佣金: $313.80');
    console.log('  - 需催单: 1个订单 (5天后到期)');
    console.log('\n二级销售 SEC888666999:');
    console.log('  - 订单: 1个 ($500)');
    console.log('  - 佣金: $125 (25%)');
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

createTestData();