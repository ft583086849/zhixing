/**
 * 快速修复时间筛选问题
 * 
 * 使用方法：
 * 1. 登录管理员后台 https://zhixing-seven.vercel.app/admin
 * 2. 打开浏览器控制台(F12)
 * 3. 复制粘贴此脚本运行
 */

console.log('🚀 快速修复时间筛选问题\n');
console.log('=' .repeat(50));

// 快速诊断
async function quickDiagnose() {
  console.log('\n📊 快速诊断...');
  
  try {
    // 检查订单表结构
    const { data: sample, error } = await supabaseClient
      .from('orders')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ 无法访问订单表:', error.message);
      return false;
    }
    
    if (!sample) {
      console.log('⚠️ 订单表为空，需要创建测试数据');
      return 'empty';
    }
    
    // 检查payment_time字段
    const hasPaymentTime = 'payment_time' in sample;
    
    if (!hasPaymentTime) {
      console.error('❌ 缺少payment_time字段 - 这是问题根源！');
      console.log('📋 当前订单表字段:', Object.keys(sample).join(', '));
      return 'missing_field';
    }
    
    console.log('✅ payment_time字段存在');
    
    // 检查是否有值
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, payment_time, status')
      .eq('status', 'confirmed_config')
      .limit(10);
    
    if (orders) {
      const withPaymentTime = orders.filter(o => o.payment_time).length;
      console.log(`📊 ${withPaymentTime}/${orders.length} 个已确认订单有payment_time值`);
      
      if (withPaymentTime === 0) {
        console.warn('⚠️ payment_time字段存在但没有值');
        return 'no_values';
      }
    }
    
    return 'ok';
    
  } catch (error) {
    console.error('❌ 诊断失败:', error);
    return 'error';
  }
}

// 显示SQL修复命令
function showSQLFix() {
  console.log('\n📝 请在Supabase SQL编辑器中执行以下命令:');
  console.log('1. 访问 Supabase 控制台');
  console.log('2. 进入 SQL Editor');
  console.log('3. 复制并执行以下SQL:\n');
  
  const sql = `
-- 添加payment_time字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP;

-- 初始化payment_time值
UPDATE orders 
SET payment_time = COALESCE(updated_at, config_time, created_at)
WHERE payment_time IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_payment_time 
ON orders(payment_time);

-- 验证结果
SELECT 
  COUNT(*) as total,
  COUNT(payment_time) as with_payment_time
FROM orders;`;
  
  console.log(sql);
  console.log('\n✅ 执行后刷新页面即可使用时间筛选功能');
}

// 临时解决方案：修改前端使用created_at
async function temporaryFix() {
  console.log('\n🔧 应用临时解决方案...');
  console.log('使用created_at代替payment_time进行筛选');
  
  try {
    // 测试不使用payment_time的筛选
    const { AdminAPI } = await import('./services/api.js');
    
    console.log('\n测试时间筛选（使用created_at）:');
    
    // 测试今天
    const todayStats = await AdminAPI.getStats({ 
      timeRange: 'today', 
      usePaymentTime: false  // 关键：不使用payment_time
    });
    console.log('今日订单:', todayStats.today_orders);
    
    // 测试本周
    const weekStats = await AdminAPI.getStats({ 
      timeRange: 'week', 
      usePaymentTime: false 
    });
    console.log('本周订单:', weekStats.total_orders);
    
    console.log('\n✅ 临时方案有效！');
    console.log('💡 建议：在数据概览和资金统计页面，暂时不传usePaymentTime参数');
    
    return true;
    
  } catch (error) {
    console.error('❌ 临时方案失败:', error);
    return false;
  }
}

// 创建测试数据
async function createTestData() {
  console.log('\n📝 创建测试数据...');
  
  const now = new Date();
  const testOrders = [
    {
      customer_name: '测试客户1',
      amount: 100,
      status: 'confirmed_config',
      payment_time: now.toISOString(),
      created_at: now.toISOString()
    },
    {
      customer_name: '测试客户2',
      amount: 200,
      status: 'confirmed_config',
      payment_time: new Date(now - 24*60*60*1000).toISOString(), // 昨天
      created_at: new Date(now - 24*60*60*1000).toISOString()
    },
    {
      customer_name: '测试客户3',
      amount: 300,
      status: 'confirmed_config',
      payment_time: new Date(now - 7*24*60*60*1000).toISOString(), // 一周前
      created_at: new Date(now - 7*24*60*60*1000).toISOString()
    }
  ];
  
  try {
    for (const order of testOrders) {
      const { error } = await supabaseClient
        .from('orders')
        .insert(order);
      
      if (error) {
        console.error('创建失败:', error);
      } else {
        console.log(`✅ 创建订单: ${order.customer_name}`);
      }
    }
    
    console.log('✅ 测试数据创建完成');
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 主流程
async function main() {
  console.log('开始诊断和修复...\n');
  
  // 1. 诊断问题
  const diagnosis = await quickDiagnose();
  
  // 2. 根据诊断结果提供解决方案
  switch (diagnosis) {
    case 'missing_field':
      console.log('\n🔴 问题：缺少payment_time字段');
      showSQLFix();
      console.log('\n或者尝试临时方案:');
      await temporaryFix();
      break;
      
    case 'no_values':
      console.log('\n🟡 问题：payment_time字段存在但无值');
      console.log('执行以下SQL更新值:');
      console.log(`
UPDATE orders 
SET payment_time = COALESCE(updated_at, config_time, created_at)
WHERE payment_time IS NULL;
      `);
      break;
      
    case 'empty':
      console.log('\n🟡 问题：订单表为空');
      console.log('是否创建测试数据？运行: createTestData()');
      break;
      
    case 'ok':
      console.log('\n✅ 系统正常，时间筛选应该可以工作');
      console.log('如果仍有问题，可能是:');
      console.log('1. 缓存问题 - 刷新页面');
      console.log('2. 部署延迟 - 等待几分钟');
      console.log('3. 前端bug - 检查控制台错误');
      break;
      
    default:
      console.log('\n❌ 无法确定问题');
      console.log('请手动检查或联系技术支持');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('可用命令:');
  console.log('- showSQLFix()     : 显示SQL修复命令');
  console.log('- temporaryFix()   : 应用临时解决方案');
  console.log('- createTestData() : 创建测试数据');
  console.log('- quickDiagnose()  : 重新诊断');
}

// 执行主流程
main();

// 导出函数
window.quickDiagnose = quickDiagnose;
window.showSQLFix = showSQLFix;
window.temporaryFix = temporaryFix;
window.createTestData = createTestData;
