// 修复历史订单时间字段的脚本
const { createClient } = require('@supabase/supabase-js');

// 正确的Supabase配置
const supabaseUrl = 'https://mbqjkpqnjnrwzuafgqed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icWprcHFuam5yd3p1YWZncWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTg0NTgsImV4cCI6MjA0ODYzNDQ1OH0.d5xoIDAJx0TR4KnBiFiWSRGDZqCPcVdZBe0G2x2hVlE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 计算到期时间
function calculateExpiryTime(effectiveTime, duration) {
  const effectiveDate = new Date(effectiveTime);
  
  switch(duration) {
    case '7days':
    case '7_days':
    case '7天':
      return new Date(effectiveDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1month':
    case '1_month':
    case '30days':
    case '1个月':
      return new Date(effectiveDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '3months':
    case '3_months':
    case '90days':
    case '3个月':
      return new Date(effectiveDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '6months':
    case '6_months':
    case '180days':
    case '6个月':
      return new Date(effectiveDate.getTime() + 180 * 24 * 60 * 60 * 1000);
    case '1year':
    case '12months':
    case '365days':
    case '1年':
      return new Date(effectiveDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      // 默认30天
      return new Date(effectiveDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

async function fixHistoricalOrderTimes() {
  console.log('========================================');
  console.log('🔧 修复历史订单时间字段');
  console.log('========================================');
  
  try {
    // 获取所有缺少时间字段的订单
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('id, order_id, status, duration, created_at, payment_time, config_time, effective_time, expiry_time')
      .or('effective_time.is.null,expiry_time.is.null');
    
    if (error) throw error;
    
    console.log(`📊 找到 ${orders.length} 个需要修复的订单`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const order of orders) {
      const updates = {};
      let needsUpdate = false;
      
      // 修复生效时间
      if (!order.effective_time) {
        // 优先使用config_time，其次payment_time，最后created_at
        updates.effective_time = order.config_time || order.payment_time || order.created_at;
        needsUpdate = true;
      }
      
      // 修复到期时间
      if (!order.expiry_time && (updates.effective_time || order.effective_time)) {
        const effectiveTime = updates.effective_time || order.effective_time;
        const expiryTime = calculateExpiryTime(effectiveTime, order.duration);
        updates.expiry_time = expiryTime.toISOString();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          const { error: updateError } = await supabase
            .from('orders_optimized')
            .update(updates)
            .eq('id', order.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ 订单 ${order.order_id} 已修复`);
          console.log(`   生效时间: ${updates.effective_time || order.effective_time}`);
          console.log(`   到期时间: ${updates.expiry_time || order.expiry_time}`);
          
          fixedCount++;
        } catch (updateError) {
          console.error(`❌ 修复订单 ${order.order_id} 失败:`, updateError.message);
          skippedCount++;
        }
      } else {
        console.log(`⏭️ 订单 ${order.order_id} 无需修复`);
        skippedCount++;
      }
      
      // 延迟一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n========================================');
    console.log('📊 修复结果统计');
    console.log('========================================');
    console.log(`✅ 成功修复: ${fixedCount} 个订单`);
    console.log(`⏭️ 跳过: ${skippedCount} 个订单`);
    console.log(`📝 总计处理: ${orders.length} 个订单`);
    
    // 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const { data: remainingOrders, error: verifyError } = await supabase
      .from('orders_optimized')
      .select('id')
      .or('effective_time.is.null,expiry_time.is.null');
    
    if (verifyError) throw verifyError;
    
    console.log(`📊 仍有 ${remainingOrders.length} 个订单缺少时间字段`);
    
    if (remainingOrders.length === 0) {
      console.log('🎉 所有订单时间字段已完整!');
    }
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error.message);
  }
}

// 仅在直接运行脚本时执行（非require时）
if (require.main === module) {
  console.log('⚠️  警告：此脚本将修改生产数据库中的订单记录');
  console.log('请确保已备份数据，或在测试环境中运行');
  console.log('如果确定要继续，请取消注释下面的代码行');
  console.log('');
  console.log('// fixHistoricalOrderTimes();');
  console.log('');
  console.log('取消注释后重新运行脚本');
  
  // 注释掉防止意外执行
  // fixHistoricalOrderTimes();
}

module.exports = { fixHistoricalOrderTimes };