// 🔍 诊断管理员仪表板数据概览无数据问题
// 执行方式：node 🔍诊断管理员仪表板数据问题.js

const { createClient } = require('@supabase/supabase-js');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

console.log('🔍 使用Supabase配置:');
console.log('   URL:', supabaseUrl);
console.log('   项目ID:', 'itvmeamoqthfqtkpubdv');
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('🔍 开始诊断管理员仪表板数据问题...\n');
  console.log('=====================================\n');

  try {
    // 1. 检查数据库连接
    console.log('📌 1. 检查数据库连接...');
    const { data: testConnection, error: connError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (connError) {
      console.error('❌ 数据库连接失败:', connError);
      return;
    }
    console.log('✅ 数据库连接正常\n');

    // 2. 检查订单表数据
    console.log('📌 2. 检查订单表数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ 查询订单表失败:', ordersError);
    } else {
      console.log(`✅ 订单表有 ${orders?.length || 0} 条记录`);
      if (orders && orders.length > 0) {
        // 分析订单状态分布
        const statusCounts = {};
        orders.forEach(order => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        console.log('   订单状态分布:', statusCounts);
        
        // 检查config_confirmed字段
        const configConfirmedCount = orders.filter(o => o.config_confirmed === true).length;
        console.log(`   config_confirmed=true 的订单: ${configConfirmedCount} 条`);
      }
    }
    console.log('');

    // 3. 检查视图是否存在
    console.log('📌 3. 检查数据库视图...');
    
    // 检查 confirmed_orders 视图
    console.log('   检查 confirmed_orders 视图...');
    const { data: confirmedOrders, error: confirmedError } = await supabase
      .from('confirmed_orders')
      .select('count')
      .limit(1);
    
    if (confirmedError) {
      console.error('   ❌ confirmed_orders 视图不存在或无法访问:', confirmedError.message);
      console.log('   ⚠️  需要重新创建 confirmed_orders 视图');
    } else {
      console.log('   ✅ confirmed_orders 视图存在');
    }

    // 检查 secondary_sales_stats 视图
    console.log('   检查 secondary_sales_stats 视图...');
    const { data: secondaryStats, error: secondaryError } = await supabase
      .from('secondary_sales_stats')
      .select('count')
      .limit(1);
    
    if (secondaryError) {
      console.error('   ❌ secondary_sales_stats 视图不存在或无法访问:', secondaryError.message);
      console.log('   ⚠️  需要重新创建 secondary_sales_stats 视图');
    } else {
      console.log('   ✅ secondary_sales_stats 视图存在');
    }

    // 检查 primary_sales_stats 视图
    console.log('   检查 primary_sales_stats 视图...');
    const { data: primaryStats, error: primaryError } = await supabase
      .from('primary_sales_stats')
      .select('count')
      .limit(1);
    
    if (primaryError) {
      console.error('   ❌ primary_sales_stats 视图不存在或无法访问:', primaryError.message);
      console.log('   ⚠️  需要重新创建 primary_sales_stats 视图');
    } else {
      console.log('   ✅ primary_sales_stats 视图存在');
    }
    console.log('');

    // 4. 测试 getStats API 逻辑
    console.log('📌 4. 测试 getStats API 逻辑...');
    
    // 模拟 getStats 方法的逻辑
    if (orders && orders.length > 0) {
      const today = new Date().toDateString();
      
      // 今日订单统计
      const todayOrders = orders.filter(order => {
        const paymentTime = order.payment_time || order.updated_at || order.created_at;
        return paymentTime && new Date(paymentTime).toDateString() === today;
      }).length;
      
      // 状态统计
      const pending_payment_orders = orders.filter(order => 
        ['pending_payment', 'pending', 'pending_review'].includes(order.status)
      ).length;
      
      const confirmed_payment_orders = orders.filter(order => 
        ['confirmed_payment', 'confirmed'].includes(order.status)
      ).length;
      
      const pending_config_orders = orders.filter(order => 
        order.status === 'pending_config'
      ).length;
      
      const confirmed_config_orders = orders.filter(order => 
        ['confirmed_configuration', 'active'].includes(order.status)
      ).length;
      
      // 金额统计
      let total_amount = 0;
      let total_commission = 0;
      
      orders.forEach(order => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const commission = parseFloat(order.commission_amount || 0);
        
        // 人民币转美元 (汇率7.15)
        if (order.payment_method === 'alipay') {
          total_amount += (amount / 7.15);
          total_commission += (commission / 7.15);
        } else {
          total_amount += amount;
          total_commission += commission;
        }
      });
      
      const stats = {
        total_orders: orders.length,
        total_amount: Math.round(total_amount * 100) / 100,
        today_orders: todayOrders,
        pending_payment_orders,
        confirmed_payment_orders,
        pending_config_orders,
        confirmed_config_orders,
        total_commission: Math.round(total_commission * 100) / 100
      };
      
      console.log('✅ 计算得出的统计数据:');
      console.log(JSON.stringify(stats, null, 2));
    }
    console.log('');

    // 5. 检查销售表数据
    console.log('📌 5. 检查销售表数据...');
    const { data: primarySales, error: primaryError2 } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales, error: secondaryError2 } = await supabase
      .from('secondary_sales')
      .select('*');
    
    console.log(`   一级销售数量: ${primarySales?.length || 0}`);
    console.log(`   二级销售数量: ${secondarySales?.length || 0}`);
    console.log('');

    // 6. 诊断结论
    console.log('=====================================');
    console.log('📊 诊断结论:');
    console.log('=====================================\n');
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  主要问题: 订单表中没有数据');
      console.log('   解决方案: 需要插入测试数据或等待真实订单');
    } else if (confirmedError || secondaryError || primaryError) {
      console.log('⚠️  主要问题: 数据库视图缺失');
      console.log('   解决方案: 需要重新创建视图');
      console.log('   执行以下SQL文件:');
      console.log('   1. ✅Step1-创建确认订单视图.sql');
      console.log('   2. ✅Step2-创建二级销售统计视图.sql');
      console.log('   3. ✅Step3-创建一级销售统计视图.sql');
    } else {
      console.log('✅ 数据库结构正常，数据存在');
      console.log('   可能的问题:');
      console.log('   1. 前端缓存问题 - 尝试清除浏览器缓存');
      console.log('   2. API连接问题 - 检查网络连接');
      console.log('   3. 登录状态问题 - 确认管理员已登录');
    }

  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

// 执行诊断
diagnose();
