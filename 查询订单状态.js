/**
 * 🔍 查询特定订单的状态信息
 * 
 * 使用方法：
 * 1. 访问任意管理页面（需要已登录）
 * 2. 打开浏览器控制台
 * 3. 复制并运行此脚本
 * 4. 调用 queryOrder(2) 查询订单ID为2的订单
 */

async function queryOrder(orderId) {
  console.log(`\n📋 查询订单 #${orderId} 的详细信息...\n`);
  
  try {
    // 1. 尝试从Redux Store获取
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
      if (state?.admin?.orders) {
        const order = state.admin.orders.find(o => o.id === orderId || o.id === String(orderId));
        if (order) {
          console.log('✅ 从Redux Store找到订单:');
          console.log('订单ID:', order.id);
          console.log('订单状态（英文）:', order.status);
          console.log('完整订单数据:');
          console.log(JSON.stringify(order, null, 2));
          return order;
        }
      }
    }
    
    // 2. 直接调用Supabase API查询
    console.log('📡 直接从数据库查询...');
    
    // 获取Supabase配置
    const supabaseUrl = 'https://xiyjbfphvhyggipwetya.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWpiZnBodmh5Z2dpcHdldHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3OTgyNzIsImV4cCI6MjA0NjM3NDI3Mn0.8yDmS-1jrU9IoKASaYvpju8Afn7y5jGPGx_z-ijDbRI';
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const order = data[0];
      console.log('✅ 从数据库找到订单:');
      console.log('\n📊 订单基本信息:');
      console.log('订单ID:', order.id);
      console.log('订单状态（英文原始数据）:', order.status);
      console.log('创建时间:', order.created_at);
      console.log('更新时间:', order.updated_at);
      
      console.log('\n💰 金额信息:');
      console.log('订单金额:', order.amount);
      console.log('实付金额:', order.actual_payment_amount);
      console.log('加密货币金额:', order.crypto_amount);
      console.log('支付方式:', order.payment_method);
      
      console.log('\n👤 客户信息:');
      console.log('客户微信:', order.customer_wechat);
      console.log('TradingView用户名:', order.tradingview_username);
      
      console.log('\n💼 销售信息:');
      console.log('销售代码:', order.sales_code);
      console.log('一级销售ID:', order.primary_sales_id);
      console.log('二级销售ID:', order.secondary_sales_id);
      console.log('佣金金额:', order.commission_amount);
      
      console.log('\n⏰ 时间信息:');
      console.log('支付时间:', order.payment_time);
      console.log('配置时间:', order.config_time);
      console.log('到期时间:', order.expiry_time);
      
      console.log('\n📝 完整订单数据:');
      console.log(JSON.stringify(order, null, 2));
      
      // 状态说明
      console.log('\n📌 状态说明:');
      const statusMap = {
        'pending_payment': '待支付',
        'confirmed_payment': '已确认支付',
        'pending_config': '待配置',
        'confirmed_config': '已配置确认',
        'confirmed_configuration': '已配置确认（兼容）',
        'active': '活跃',
        'expired': '已过期',
        'cancelled': '已取消',
        'refunded': '已退款',
        'rejected': '已拒绝',
        'incomplete': '未完成'
      };
      
      console.log(`当前状态 "${order.status}" 的中文含义: ${statusMap[order.status] || '未知状态'}`);
      
      return order;
    } else {
      console.log('❌ 未找到订单 #' + orderId);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    console.error('错误详情:', error.message);
    return null;
  }
}

// 批量查询多个订单
async function queryMultipleOrders(orderIds) {
  console.log(`\n📋 批量查询订单: [${orderIds.join(', ')}]\n`);
  
  for (const id of orderIds) {
    await queryOrder(id);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// 查询所有订单的状态分布
async function queryOrderStatusDistribution() {
  console.log('\n📊 查询所有订单的状态分布...\n');
  
  try {
    const supabaseUrl = 'https://xiyjbfphvhyggipwetya.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWpiZnBodmh5Z2dpcHdldHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3OTgyNzIsImV4cCI6MjA0NjM3NDI3Mn0.8yDmS-1jrU9IoKASaYvpju8Afn7y5jGPGx_z-ijDbRI';
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=id,status`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const orders = await response.json();
    
    // 统计各状态的订单数量
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    
    console.log('订单总数:', orders.length);
    console.log('\n状态分布:');
    Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const percentage = ((count / orders.length) * 100).toFixed(2);
      console.log(`  ${status}: ${count} (${percentage}%)`);
    });
    
    return statusCount;
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    return null;
  }
}

// 导出函数供全局使用
window.queryOrder = queryOrder;
window.queryMultipleOrders = queryMultipleOrders;
window.queryOrderStatusDistribution = queryOrderStatusDistribution;

console.log('✅ 查询脚本已加载!');
console.log('\n可用命令:');
console.log('• queryOrder(2) - 查询订单ID为2的详细信息');
console.log('• queryMultipleOrders([1,2,3]) - 批量查询多个订单');
console.log('• queryOrderStatusDistribution() - 查询所有订单的状态分布');
console.log('\n立即查询订单 #2...');

// 自动查询订单ID为2的订单
queryOrder(2);
