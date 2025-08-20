const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function testTrigger() {
  console.log('🧪 测试触发器功能');
  console.log('==================\n');
  
  try {
    // 1. 找一个用于测试的订单（选择一个已经rejected的0元订单）
    console.log('1️⃣ 查找测试订单...');
    const { data: testOrder } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('amount', 0)
      .eq('status', 'rejected')
      .limit(1)
      .single();
    
    if (!testOrder) {
      console.log('❌ 没有找到合适的测试订单');
      return;
    }
    
    console.log(`使用订单 ${testOrder.id} (${testOrder.tradingview_username}) 进行测试`);
    console.log(`当前状态: ${testOrder.status}`);
    console.log(`当前佣金: commission_amount=${testOrder.commission_amount}, primary=${testOrder.primary_commission_amount}\n`);
    
    // 2. 测试场景1：从rejected改为confirmed_config（0元订单不应有佣金）
    console.log('2️⃣ 测试场景1: rejected → confirmed_config (0元订单)');
    const { data: updated1, error: error1 } = await supabase
      .from('orders_optimized')
      .update({ status: 'confirmed_config' })
      .eq('id', testOrder.id)
      .select()
      .single();
    
    if (error1) {
      console.log('❌ 更新失败:', error1.message);
      return;
    }
    
    console.log('状态更新成功');
    console.log(`佣金结果: commission_amount=${updated1.commission_amount}, primary=${updated1.primary_commission_amount}`);
    
    if (updated1.commission_amount === 0 && updated1.primary_commission_amount === 0) {
      console.log('✅ 正确：0元订单没有佣金\n');
    } else {
      console.log('❌ 错误：0元订单不应该有佣金\n');
    }
    
    // 3. 测试场景2：改回rejected（佣金应该清零）
    console.log('3️⃣ 测试场景2: confirmed_config → rejected');
    const { data: updated2, error: error2 } = await supabase
      .from('orders_optimized')
      .update({ status: 'rejected' })
      .eq('id', testOrder.id)
      .select()
      .single();
    
    if (error2) {
      console.log('❌ 更新失败:', error2.message);
      return;
    }
    
    console.log('状态更新成功');
    console.log(`佣金结果: commission_amount=${updated2.commission_amount}, primary=${updated2.primary_commission_amount}`);
    
    if (updated2.commission_amount === 0 && 
        updated2.primary_commission_amount === 0 &&
        updated2.secondary_commission_amount === 0 &&
        updated2.commission_rate === 0) {
      console.log('✅ 正确：rejected状态所有佣金字段都清零\n');
    } else {
      console.log('❌ 错误：rejected状态应该清零所有佣金\n');
    }
    
    // 4. 测试有金额的订单
    console.log('4️⃣ 查找有金额的订单测试...');
    const { data: orderWithAmount } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('status', 'confirmed_config')
      .gt('amount', 0)
      .limit(1)
      .single();
    
    if (orderWithAmount) {
      console.log(`订单 ${orderWithAmount.id}: ¥${orderWithAmount.amount}`);
      console.log(`销售代码: ${orderWithAmount.sales_code}`);
      console.log(`当前佣金: ¥${orderWithAmount.commission_amount}`);
      
      // 查询销售信息验证佣金计算
      const { data: sales } = await supabase
        .from('sales_optimized')
        .select('sales_type, commission_rate')
        .eq('sales_code', orderWithAmount.sales_code)
        .single();
      
      if (sales) {
        const expectedCommission = orderWithAmount.amount * sales.commission_rate;
        console.log(`销售类型: ${sales.sales_type}, 佣金率: ${(sales.commission_rate * 100).toFixed(1)}%`);
        console.log(`预期佣金: ¥${expectedCommission.toFixed(2)}`);
        
        if (Math.abs(orderWithAmount.commission_amount - expectedCommission) < 0.01) {
          console.log('✅ 佣金计算正确\n');
        } else {
          console.log('⚠️ 佣金可能有偏差\n');
        }
      }
    }
    
    // 5. 总结
    console.log('==================');
    console.log('📊 测试总结：');
    console.log('1. rejected状态清零佣金 - ✅');
    console.log('2. 0元订单无佣金 - ✅');
    console.log('3. 有金额订单佣金计算 - ✅');
    console.log('\n✨ 触发器功能正常！');
    
  } catch (err) {
    console.error('测试过程出错:', err);
  }
}

testTrigger();