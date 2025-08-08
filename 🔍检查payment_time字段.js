/**
 * 检查订单表中的payment_time字段
 * 
 * 使用方法：
 * 1. 登录管理员后台
 * 2. 打开浏览器控制台(F12)
 * 3. 复制粘贴此脚本运行
 */

console.log('🔍 检查订单表payment_time字段问题...\n');

// 主检查函数
async function checkPaymentTimeIssue() {
  try {
    // 1. 获取一个订单样本看看有哪些字段
    console.log('📋 1. 检查订单表结构:');
    const { data: sampleOrder, error: sampleError } = await supabaseClient
      .from('orders')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('❌ 获取订单样本失败:', sampleError);
      return;
    }
    
    if (sampleOrder) {
      console.log('订单表字段:');
      const fields = Object.keys(sampleOrder);
      fields.forEach(field => {
        const value = sampleOrder[field];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${field}: ${type}`);
      });
      
      // 检查是否有payment_time字段
      if ('payment_time' in sampleOrder) {
        console.log('\n✅ payment_time字段存在');
        console.log('  值:', sampleOrder.payment_time);
      } else {
        console.error('\n❌ payment_time字段不存在！');
        console.log('  这就是时间筛选不生效的原因');
      }
      
      // 检查相关时间字段
      console.log('\n📅 时间相关字段:');
      const timeFields = ['created_at', 'updated_at', 'payment_time', 'config_time', 'effective_time', 'expiry_time'];
      timeFields.forEach(field => {
        if (field in sampleOrder) {
          console.log(`  ✅ ${field}: ${sampleOrder[field]}`);
        } else {
          console.log(`  ❌ ${field}: 不存在`);
        }
      });
    } else {
      console.log('⚠️ 订单表为空');
    }
    
    // 2. 获取几个已确认的订单，看看它们的时间字段
    console.log('\n📊 2. 检查已确认订单的时间字段:');
    const { data: confirmedOrders, error: confirmedError } = await supabaseClient
      .from('orders')
      .select('id, status, created_at, updated_at, payment_time, config_time')
      .eq('status', 'confirmed_config')
      .limit(5);
    
    if (confirmedError) {
      console.error('❌ 获取确认订单失败:', confirmedError);
    } else if (confirmedOrders && confirmedOrders.length > 0) {
      console.log(`找到 ${confirmedOrders.length} 个已确认订单:`);
      confirmedOrders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1} (ID: ${order.id}):`);
        console.log(`  - status: ${order.status}`);
        console.log(`  - created_at: ${order.created_at}`);
        console.log(`  - updated_at: ${order.updated_at}`);
        console.log(`  - payment_time: ${order.payment_time || '❌ 无'}`);
        console.log(`  - config_time: ${order.config_time || '❌ 无'}`);
      });
      
      // 统计有payment_time的订单
      const withPaymentTime = confirmedOrders.filter(o => o.payment_time).length;
      console.log(`\n📊 统计: ${withPaymentTime}/${confirmedOrders.length} 个订单有payment_time`);
    } else {
      console.log('⚠️ 没有已确认的订单');
    }
    
    // 3. 测试当前的时间筛选逻辑
    console.log('\n🧪 3. 测试时间筛选逻辑:');
    
    // 获取所有订单
    const { data: allOrders, error: allError } = await supabaseClient
      .from('orders')
      .select('*');
    
    if (allError) {
      console.error('❌ 获取订单失败:', allError);
      return;
    }
    
    if (allOrders && allOrders.length > 0) {
      console.log(`总订单数: ${allOrders.length}`);
      
      // 测试按created_at筛选（今天）
      const today = new Date().toDateString();
      const todayByCreated = allOrders.filter(order => {
        return new Date(order.created_at).toDateString() === today;
      });
      console.log(`今天的订单(按created_at): ${todayByCreated.length}`);
      
      // 测试按payment_time筛选（如果存在）
      if (allOrders[0] && 'payment_time' in allOrders[0]) {
        const todayByPayment = allOrders.filter(order => {
          return order.payment_time && new Date(order.payment_time).toDateString() === today;
        });
        console.log(`今天的订单(按payment_time): ${todayByPayment.length}`);
      } else {
        // 测试按updated_at筛选（作为payment_time的替代）
        const todayByUpdated = allOrders.filter(order => {
          return order.updated_at && new Date(order.updated_at).toDateString() === today;
        });
        console.log(`今天的订单(按updated_at作为替代): ${todayByUpdated.length}`);
      }
      
      // 测试本周筛选
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekByCreated = allOrders.filter(order => {
        return new Date(order.created_at) >= weekAgo;
      });
      console.log(`本周的订单(按created_at): ${weekByCreated.length}`);
    }
    
    // 4. 提供解决方案
    console.log('\n💡 解决方案:');
    
    if (!sampleOrder || !('payment_time' in sampleOrder)) {
      console.log('1. 添加payment_time字段到orders表:');
      console.log(`
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP;

-- 初始化payment_time为updated_at（对于已确认的订单）
UPDATE orders 
SET payment_time = updated_at 
WHERE status = 'confirmed_config' AND payment_time IS NULL;
      `);
      
      console.log('\n2. 或者修改代码使用updated_at作为payment_time:');
      console.log('   在api.js中，将所有payment_time改为updated_at');
      
      console.log('\n3. 临时解决：使用created_at筛选');
      console.log('   在调用getStats时不传usePaymentTime参数');
    } else {
      console.log('✅ payment_time字段存在');
      console.log('问题可能是:');
      console.log('1. payment_time字段值为空');
      console.log('2. 时间格式不正确');
      console.log('3. 前端传参问题');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 快速修复：添加payment_time字段
async function addPaymentTimeField() {
  console.log('\n🔧 尝试添加payment_time字段...');
  console.log('请在Supabase SQL编辑器中执行以下SQL:');
  console.log(`
-- 添加payment_time字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP;

-- 使用updated_at初始化payment_time（对于已确认的订单）
UPDATE orders 
SET payment_time = updated_at 
WHERE status = 'confirmed_config' AND payment_time IS NULL;

-- 对于其他状态的订单，可以考虑:
UPDATE orders 
SET payment_time = updated_at 
WHERE payment_time IS NULL AND updated_at IS NOT NULL;
  `);
}

// 测试时间筛选
async function testTimeFilter(timeRange = 'today', usePaymentTime = true) {
  console.log(`\n🧪 测试时间筛选: ${timeRange}, 使用${usePaymentTime ? 'payment_time' : 'created_at'}`);
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    const stats = await AdminAPI.getStats({ 
      timeRange, 
      usePaymentTime 
    });
    
    console.log('返回的统计数据:');
    console.log('  - 总金额:', stats.total_amount);
    console.log('  - 今日订单:', stats.today_orders);
    console.log('  - 本周订单:', stats.week_orders);
    console.log('  - 总订单数:', stats.total_orders);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行检查
checkPaymentTimeIssue();

// 导出函数
window.checkPaymentTimeIssue = checkPaymentTimeIssue;
window.addPaymentTimeField = addPaymentTimeField;
window.testTimeFilter = testTimeFilter;

console.log('\n可用命令:');
console.log('- checkPaymentTimeIssue() : 重新检查');
console.log('- addPaymentTimeField()   : 显示添加字段的SQL');
console.log('- testTimeFilter("week")  : 测试时间筛选');
