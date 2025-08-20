const { createClient } = require('@supabase/supabase-js');

// Supabase配置（从客户端配置文件获取）
const supabaseUrl = 'https://abeczdvdvvgpgzgozpnu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZWN6ZHZkdnZncGd6Z296cG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Nzc0MTcsImV4cCI6MjA1MDU1MzQxN30.mBBmjz7lRCJKF7AuoBLjruxL8kA_01mDYVPPWPIXJRI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPrimarySalesSettlement() {
  console.log('🔍 开始测试一级销售对账API...');
  console.log('查询参数: sales_code = PRI17547241780648255');
  
  try {
    // 1. 首先查找一级销售基本信息
    console.log('\n📋 步骤1: 查询一级销售基本信息');
    const { data: primarySales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', 'PRI17547241780648255')
      .eq('sales_type', 'primary')
      .single();

    if (salesError) {
      console.log('❌ 销售信息查询错误:', salesError.message);
      return;
    }

    if (!primarySales) {
      console.log('❌ 未找到销售代码为 PRI17547241780648255 的一级销售');
      return;
    }

    console.log('✅ 找到一级销售信息:');
    console.log(`   微信号: ${primarySales.wechat_name}`);
    console.log(`   销售代码: ${primarySales.sales_code}`);
    console.log(`   注册时间: ${primarySales.created_at}`);

    // 验证微信号是否是期望的 WML792355703
    if (primarySales.wechat_name === 'WML792355703') {
      console.log('✅ 销售员微信号正确: WML792355703');
    } else {
      console.log(`⚠️ 销售员微信号不匹配，期望: WML792355703，实际: ${primarySales.wechat_name}`);
    }

    // 2. 查询该一级销售的订单（包括直接订单和二级销售订单）
    console.log('\n📋 步骤2: 查询相关订单');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        customer_wechat,
        tradingview_username,
        duration,
        amount,
        actual_payment_amount,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount,
        sales_code,
        primary_sales_code,
        status,
        config_confirmed,
        created_at
      `)
      .eq('primary_sales_code', primarySales.sales_code)
      .eq('config_confirmed', true);

    if (ordersError) {
      console.log('❌ 订单查询错误:', ordersError.message);
      return;
    }

    console.log(`✅ 找到 ${orders.length} 个已配置确认的订单`);

    // 3. 统计佣金数据
    console.log('\n📊 步骤3: 统计佣金数据');
    
    let totalCommission = 0;
    let totalOrders = orders.length;
    let totalAmount = 0;

    orders.forEach(order => {
      const commission = parseFloat(order.primary_commission_amount || 0);
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      
      totalCommission += commission;
      totalAmount += amount;
    });

    console.log(`📈 统计结果:`);
    console.log(`   总佣金: $${totalCommission.toFixed(2)}`);
    console.log(`   总订单数: ${totalOrders} 单`);
    console.log(`   总订单金额: $${totalAmount.toFixed(2)}`);

    // 验证是否还是全0
    if (totalCommission === 0) {
      console.log('⚠️ 总佣金仍然为 $0.00 - 可能存在问题');
    } else {
      console.log('✅ 总佣金不为零 - 数据正常');
    }

    if (totalOrders === 0) {
      console.log('⚠️ 总订单数为 0 - 可能存在问题');
    } else {
      console.log('✅ 订单数据正常');
    }

    // 4. 查询二级销售
    console.log('\n👥 步骤4: 查询二级销售信息');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('primary_sales_code', primarySales.sales_code)
      .eq('sales_type', 'secondary');

    if (secondaryError) {
      console.log('❌ 二级销售查询错误:', secondaryError.message);
    } else {
      console.log(`✅ 找到 ${secondarySales.length} 个二级销售`);
    }

    // 5. 显示示例订单详情
    if (orders.length > 0) {
      console.log('\n📄 步骤5: 示例订单详情（前3个）:');
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`订单 ${index + 1}:`);
        console.log(`   ID: ${order.id}`);
        console.log(`   客户微信: ${order.customer_wechat}`);
        console.log(`   TradingView用户: ${order.tradingview_username}`);
        console.log(`   金额: $${parseFloat(order.actual_payment_amount || order.amount || 0).toFixed(2)}`);
        console.log(`   一级佣金: $${parseFloat(order.primary_commission_amount || 0).toFixed(2)}`);
        console.log(`   状态: ${order.status}`);
        console.log('   ---');
      });
    }

    // 6. 测试页面能否正确访问数据
    console.log('\n🌐 步骤6: 测试结果总结');
    console.log('='.repeat(50));
    
    const testResults = {
      销售员微信正确: primarySales.wechat_name === 'WML792355703',
      佣金不为零: totalCommission > 0,
      订单数不为零: totalOrders > 0,
      数据完整性: orders.length > 0 && orders.every(o => o.config_confirmed === true)
    };

    console.log('测试项目检查:');
    Object.entries(testResults).forEach(([key, value]) => {
      console.log(`   ${key}: ${value ? '✅ 通过' : '❌ 失败'}`);
    });

    const allPassed = Object.values(testResults).every(v => v === true);
    console.log(`\n🎯 总体结果: ${allPassed ? '✅ 修复成功' : '❌ 仍有问题'}`);

    if (!allPassed) {
      console.log('\n🔧 需要检查的问题:');
      if (!testResults.销售员微信正确) {
        console.log('   - 销售员微信号不匹配，检查数据库sales_optimized表');
      }
      if (!testResults.佣金不为零) {
        console.log('   - 佣金计算可能有问题，检查primary_commission_amount字段');
      }
      if (!testResults.订单数不为零) {
        console.log('   - 订单数据可能有问题，检查orders_optimized表和config_confirmed字段');
      }
      if (!testResults.数据完整性) {
        console.log('   - 数据完整性问题，检查订单的配置确认状态');
      }
    }

    return testResults;

  } catch (error) {
    console.error('🔥 测试过程中发生错误:', error.message);
    console.error('堆栈信息:', error.stack);
    return false;
  }
}

// 运行测试
testPrimarySalesSettlement().then(results => {
  if (results) {
    const success = Object.values(results).every(v => v === true);
    console.log(`\n📊 最终状态: ${success ? '页面修复完成' : '仍需进一步修复'}`);
    process.exit(success ? 0 : 1);
  } else {
    console.log('\n❌ 测试失败');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 测试执行异常:', error);
  process.exit(1);
});