const axios = require('axios');

async function testAdminStats() {
  console.log('🔍 测试管理员统计数据API\n');
  
  try {
    // 1. 登录获取token
    console.log('1️⃣ 登录获取token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取token');
    
    // 2. 测试统计数据API
    console.log('\n2️⃣ 测试统计数据API...');
    const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 统计数据API正常');
    console.log('返回数据:', JSON.stringify(statsResponse.data, null, 2));
    
    // 3. 测试订单列表API
    console.log('\n3️⃣ 测试订单列表API...');
    const ordersResponse = await axios.get('http://localhost:5000/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ 订单列表API正常');
    console.log('订单数量:', ordersResponse.data.data.orders.length);
    console.log('分页信息:', ordersResponse.data.data.pagination);
    
    // 4. 测试销售链接API
    console.log('\n4️⃣ 测试销售链接API...');
    const salesResponse = await axios.get('http://localhost:5000/api/admin/links', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 销售链接API正常');
    console.log('销售链接数量:', salesResponse.data.data.length);
    
    console.log('\n🎉 所有管理员API测试通过！');
    console.log('\n📊 数据概览应该显示：');
    console.log('- 总订单数:', statsResponse.data.data.total_orders);
    console.log('- 待付款确认订单:', statsResponse.data.data.pending_payment_orders);
    console.log('- 待配置确认订单:', statsResponse.data.data.pending_config_orders);
    console.log('- 已付款确认订单:', statsResponse.data.data.confirmed_payment_orders);
    console.log('- 已配置确认订单:', statsResponse.data.data.confirmed_config_orders);
    console.log('- 总收入:', statsResponse.data.data.total_amount);
    
    console.log('\n🔧 如果前端页面仍然为空，可能的原因：');
    console.log('1. 前端API调用失败');
    console.log('2. Redux状态管理问题');
    console.log('3. 组件渲染问题');
    console.log('4. 网络请求被拦截');
    
    console.log('\n📱 建议检查：');
    console.log('1. 打开浏览器开发者工具');
    console.log('2. 查看Network标签页的API请求');
    console.log('3. 查看Console标签页的错误信息');
    console.log('4. 检查Redux DevTools的状态');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 认证失败，请检查：');
      console.log('1. 登录信息是否正确');
      console.log('2. token是否有效');
      console.log('3. 后端认证中间件是否正常');
    } else if (error.response?.status === 500) {
      console.log('\n🔧 服务器错误，请检查：');
      console.log('1. 数据库连接是否正常');
      console.log('2. 后端服务是否正常运行');
      console.log('3. 数据库表是否存在');
    }
  }
}

testAdminStats(); 