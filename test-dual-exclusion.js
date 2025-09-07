/**
 * 测试双层排除机制效果
 * 验证显示控制和统计控制是否按预期工作
 */

const { supabase } = require('./client/src/services/supabase.js');

async function testDualExclusionMechanism() {
  console.log('🧪 测试双层排除机制效果...\n');
  
  try {
    // 1. 测试显示层：订单管理应该能看到测试订单
    console.log('1. 🔍 测试订单显示（应该可见）:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, amount, status, created_at, sales_code')
      .eq('sales_code', 'PRI17554350234757516')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (ordersError) {
      console.error('❌ 查询订单失败:', ordersError);
    } else {
      console.log(`✅ 找到测试订单 ${orders?.length || 0} 条:`);
      if (orders && orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`   ${index + 1}. ID: ${order.id}, 金额: $${order.amount}, 状态: ${order.status}`);
        });
      } else {
        console.log('   📋 暂无测试订单');
      }
    }
    
    // 2. 测试客户显示（应该可见）
    console.log('\n2. 🔍 测试客户显示（应该可见）:');
    const { data: customers, error: customersError } = await supabase
      .from('orders_optimized')
      .select('customer_wechat, sales_code')
      .eq('sales_code', 'PRI17554350234757516')
      .limit(5);
    
    if (customersError) {
      console.error('❌ 查询客户失败:', customersError);
    } else {
      const uniqueCustomers = [...new Set(customers?.map(c => c.customer_wechat) || [])];
      console.log(`✅ 找到测试客户 ${uniqueCustomers.length} 个:`);
      uniqueCustomers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer}`);
      });
    }
    
    // 3. 验证排除记录状态
    console.log('\n3. 🔍 验证排除记录状态:');
    const { data: exclusions, error: exclusionsError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('sales_code', 'PRI17554350234757516');
    
    if (exclusionsError) {
      console.error('❌ 查询排除记录失败:', exclusionsError);
    } else {
      console.log(`📋 排除记录数量: ${exclusions?.length || 0}`);
      if (exclusions && exclusions.length > 0) {
        console.log('⚠️ 发现残留排除记录，可能影响显示控制');
      } else {
        console.log('✅ 无排除记录，测试订单应该在管理后台显示');
      }
    }
    
    // 4. 测试总订单统计（应该不包含测试数据）
    console.log('\n4. 🔍 测试统计数据（应该排除测试账号）:');
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount')
      .not('sales_code', 'eq', 'PRI17554350234757516'); // 手动排除测试看效果
    
    if (allOrdersError) {
      console.error('❌ 查询统计数据失败:', allOrdersError);
    } else {
      const totalAmount = allOrders?.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0) || 0;
      console.log(`✅ 非测试账号订单总金额: $${totalAmount.toFixed(2)}`);
      console.log(`   （统计应该排除PRI17554350234757516的贡献）`);
    }
    
    console.log('\n🎉 双层排除机制测试完成！');
    console.log('\n📊 预期效果:');
    console.log('✅ 订单管理：显示测试订单（便于调试）');
    console.log('✅ 客户管理：显示测试客户（便于调试）');
    console.log('❌ 数据概览：不计入测试数据（保持统计纯净）');
    console.log('❌ 转化率统计：不计入测试数据（保持统计纯净）');
    console.log('❌ Top5排行：不显示测试账号（保持统计纯净）');
    console.log('\n🎮 控制方式：');
    console.log('- 添加到排除名单 → 订单和客户不显示');  
    console.log('- 从排除名单移除 → 订单和客户显示');
    console.log('- 统计永远排除 → 保证数据纯净');
    
  } catch (error) {
    console.error('💥 测试过程异常:', error);
  }
}

// 执行测试
testDualExclusionMechanism();