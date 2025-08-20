/**
 * 分析订单状态实际使用情况
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeOrderStatus() {
  try {
    console.log('📊 开始分析订单状态使用情况...\n');

    // 1. 统计所有订单状态分布
    console.log('1️⃣ 订单状态分布统计:');
    const { data: statusStats, error: statusError } = await supabase
      .from('orders_optimized')
      .select('status')
      .order('status');
    
    if (statusError) {
      console.error('获取状态数据失败:', statusError);
      return;
    }

    // 统计各状态数量
    const statusCount = {};
    statusStats.forEach(order => {
      const status = order.status || 'null';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const totalOrders = statusStats.length;
    Object.entries(statusCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        const percentage = ((count / totalOrders) * 100).toFixed(2);
        console.log(`   ${status}: ${count} 订单 (${percentage}%)`);
      });
    
    console.log(`   总计: ${totalOrders} 订单\n`);

    // 2. 统计支付状态分布（如果有这个字段）
    console.log('2️⃣ 支付状态分布统计:');
    const { data: paymentStats, error: paymentError } = await supabase
      .from('orders_optimized')
      .select('payment_status')
      .order('payment_status');
    
    if (!paymentError && paymentStats) {
      const paymentCount = {};
      paymentStats.forEach(order => {
        const status = order.payment_status || 'null';
        paymentCount[status] = (paymentCount[status] || 0) + 1;
      });

      Object.entries(paymentCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([status, count]) => {
          const percentage = ((count / totalOrders) * 100).toFixed(2);
          console.log(`   ${status}: ${count} 订单 (${percentage}%)`);
        });
    } else {
      console.log('   payment_status字段不存在或查询失败');
    }
    
    console.log('');

    // 3. 检查数据质量
    console.log('3️⃣ 数据质量检查:');
    const { data: qualityData, error: qualityError } = await supabase
      .from('orders_optimized')
      .select('status, payment_status, created_at')
      .limit(1000);
    
    if (!qualityError && qualityData) {
      const nullStatus = qualityData.filter(o => !o.status).length;
      const nullPaymentStatus = qualityData.filter(o => !o.payment_status).length;
      const knownStatuses = ['pending', 'confirmed', 'cancelled', 'expired', 'confirmed_config', 'pending_payment', 'pending_config', 'rejected', 'completed', 'processing', 'confirmed_payment', 'active'];
      const unknownStatus = qualityData.filter(o => o.status && !knownStatuses.includes(o.status)).length;
      
      console.log(`   空状态订单: ${nullStatus}`);
      console.log(`   空支付状态订单: ${nullPaymentStatus}`);
      console.log(`   未知状态订单: ${unknownStatus}`);
      console.log(`   检查的订单总数: ${qualityData.length}\n`);
    }

    // 4. 查看各状态的最新订单示例
    console.log('4️⃣ 各状态最新订单示例:');
    const uniqueStatuses = Object.keys(statusCount);
    
    for (const status of uniqueStatuses) {
      const { data: example, error: exampleError } = await supabase
        .from('orders_optimized')
        .select('id, status, payment_status, customer_name, amount, created_at')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!exampleError && example && example.length > 0) {
        const order = example[0];
        console.log(`   ${status}: 订单#${order.id}, 客户:${order.customer_name || '未知'}, 金额:$${order.amount || 0}, 创建时间:${order.created_at}`);
      }
    }

    console.log('\n✅ 分析完成');

  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

// 运行分析
analyzeOrderStatus();