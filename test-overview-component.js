const axios = require('axios');

async function testOverviewComponent() {
  console.log('🔍 测试数据概览组件\n');
  
  try {
    // 1. 登录获取token
    console.log('1️⃣ 登录获取token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 2. 测试统计数据API
    console.log('\n2️⃣ 测试统计数据API...');
    const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const stats = statsResponse.data.data;
    console.log('✅ 统计数据获取成功');
    
    // 3. 模拟组件渲染逻辑
    console.log('\n3️⃣ 模拟组件渲染逻辑...');
    
    // 检查数据是否为空
    if (!stats) {
      console.log('❌ 统计数据为空');
      return;
    }
    
    // 检查关键字段
    const requiredFields = [
      'total_orders',
      'pending_payment_orders', 
      'pending_config_orders',
      'confirmed_payment_orders',
      'confirmed_config_orders',
      'total_amount'
    ];
    
    console.log('📊 数据字段检查:');
    requiredFields.forEach(field => {
      const value = stats[field] || 0;
      console.log(`- ${field}: ${value}`);
    });
    
    // 4. 检查是否有数据
    const hasData = stats.total_orders > 0 || 
                   stats.pending_payment_orders > 0 || 
                   stats.pending_config_orders > 0 ||
                   stats.confirmed_payment_orders > 0 ||
                   stats.confirmed_config_orders > 0 ||
                   stats.total_amount > 0;
    
    if (hasData) {
      console.log('\n✅ 有数据可以显示');
      console.log('📊 应该显示的内容:');
      console.log(`- 总订单数: ${stats.total_orders}`);
      console.log(`- 待付款确认订单: ${stats.pending_payment_orders}`);
      console.log(`- 待配置确认订单: ${stats.pending_config_orders}`);
      console.log(`- 已付款确认订单: ${stats.confirmed_payment_orders}`);
      console.log(`- 已配置确认订单: ${stats.confirmed_config_orders}`);
      console.log(`- 总收入: $${stats.total_amount}`);
    } else {
      console.log('\n⚠️  没有数据可以显示');
      console.log('📋 可能的原因:');
      console.log('1. 数据库中还没有订单数据');
      console.log('2. 所有订单状态都是rejected');
      console.log('3. 数据统计逻辑有问题');
    }
    
    // 5. 检查订单数据
    console.log('\n4️⃣ 检查订单数据...');
    const ordersResponse = await axios.get('http://localhost:5000/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { page: 1, limit: 10 }
    });
    
    const orders = ordersResponse.data.data.orders;
    console.log(`✅ 找到 ${orders.length} 个订单`);
    
    if (orders.length > 0) {
      console.log('📋 订单状态统计:');
      const statusCount = {};
      orders.forEach(order => {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`- ${status}: ${count}个`);
      });
    }
    
    console.log('\n🎉 测试完成！');
    console.log('\n📱 如果前端页面仍然为空，请检查:');
    console.log('1. 浏览器开发者工具的Console标签页');
    console.log('2. 是否有JavaScript错误');
    console.log('3. Redux状态是否正确更新');
    console.log('4. 组件是否正确渲染');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testOverviewComponent(); 