// 在浏览器控制台执行此脚本检查转化率逻辑
// 访问 http://localhost:3000/admin/overview 后运行

console.log('=== 检查 PRI17548273477088006 的订单数据 ===\n');

// 使用AdminAPI获取该销售的订单数据
async function checkConversionLogic() {
  const salesCode = 'PRI17548273477088006';
  
  // 如果有supabase客户端
  if (window.supabaseClient) {
    const { data: orders } = await window.supabaseClient
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', salesCode);
    
    if (orders) {
      console.log('订单统计:');
      console.log('- 总订单数:', orders.length);
      
      // 过滤有效订单（排除rejected）
      const validOrders = orders.filter(o => o.status !== 'rejected');
      console.log('- 有效订单数（排除rejected）:', validOrders.length);
      
      // 统计有金额的订单（收费订单）
      const paidOrders = validOrders.filter(o => {
        const amount = parseFloat(o.amount || 0);
        const actualAmount = parseFloat(o.actual_payment_amount || 0);
        return amount > 0 || actualAmount > 0;
      });
      console.log('- 收费订单数（amount > 0）:', paidOrders.length);
      
      // 统计免费订单
      const freeOrders = validOrders.filter(o => {
        const amount = parseFloat(o.amount || 0);
        const actualAmount = parseFloat(o.actual_payment_amount || 0);
        return amount === 0 && actualAmount === 0;
      });
      console.log('- 免费订单数（amount = 0）:', freeOrders.length);
      
      console.log('\n订单详情:');
      console.log('前5个订单:');
      validOrders.slice(0, 5).forEach((order, index) => {
        const amount = parseFloat(order.amount || 0);
        const actualAmount = parseFloat(order.actual_payment_amount || 0);
        console.log(`${index + 1}. 订单号: ${order.order_number}`);
        console.log(`   状态: ${order.status}`);
        console.log(`   时长: ${order.duration}`);
        console.log(`   金额: $${amount}, 实付: $${actualAmount}`);
        console.log(`   类型: ${amount > 0 || actualAmount > 0 ? '收费订单' : '免费订单'}`);
      });
      
      console.log('\n转化率计算:');
      const conversionRate = validOrders.length > 0 
        ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
        : 0;
      console.log(`正确的公式: 收费订单数 / 有效订单数`);
      console.log(`转化率: ${paidOrders.length} / ${validOrders.length} = ${conversionRate}%`);
      
      console.log('\n当前页面显示的问题:');
      console.log('- 把confirmed_config_orders当作收费订单（错误）');
      console.log('- 应该统计amount > 0的订单作为收费订单（正确）');
      
      // 测试正确的API
      console.log('\n测试正确的转化率API:');
      if (window.AdminAPI && window.AdminAPI.getConversionStats) {
        const result = await window.AdminAPI.getConversionStats({ 
          wechat_name: 'Yi111111____' 
        });
        console.log('API返回:', result);
      }
    } else {
      console.log('没有找到订单数据');
    }
  } else {
    console.log('Supabase客户端不可用，请确保已登录管理后台');
  }
}

checkConversionLogic();