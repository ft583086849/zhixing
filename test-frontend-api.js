const axios = require('axios');

async function testFrontendAPI() {
  console.log('🔍 测试前端API调用\n');
  
  try {
    // 1. 模拟前端登录
    console.log('1️⃣ 模拟前端登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 2. 模拟前端API调用（使用相同的baseURL）
    console.log('\n2️⃣ 模拟前端API调用...');
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 10000,
    });
    
    // 添加请求拦截器（模拟前端）
    api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // 添加响应拦截器（模拟前端）
    api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          console.log('❌ 认证失败，需要重新登录');
        }
        return Promise.reject(error);
      }
    );
    
    // 3. 测试统计数据API
    console.log('\n3️⃣ 测试统计数据API...');
    const statsResponse = await api.get('/admin/stats');
    console.log('✅ 统计数据API调用成功');
    console.log('数据:', statsResponse.data.data);
    
    // 4. 测试订单列表API
    console.log('\n4️⃣ 测试订单列表API...');
    const ordersResponse = await api.get('/admin/orders', {
      params: { page: 1, limit: 10 }
    });
    console.log('✅ 订单列表API调用成功');
    console.log('订单数量:', ordersResponse.data.data.orders.length);
    
    // 5. 测试销售链接API
    console.log('\n5️⃣ 测试销售链接API...');
    const salesResponse = await api.get('/admin/links');
    console.log('✅ 销售链接API调用成功');
    console.log('销售链接数量:', salesResponse.data.data.length);
    
    console.log('\n🎉 前端API调用测试通过！');
    console.log('\n📊 应该显示的数据：');
    console.log('- 总订单数:', statsResponse.data.data.total_orders);
    console.log('- 待付款确认订单:', statsResponse.data.data.pending_payment_orders);
    console.log('- 待配置确认订单:', statsResponse.data.data.pending_config_orders);
    console.log('- 已付款确认订单:', statsResponse.data.data.confirmed_payment_orders);
    console.log('- 已配置确认订单:', statsResponse.data.data.confirmed_config_orders);
    console.log('- 总收入:', statsResponse.data.data.total_amount);
    
    console.log('\n🔧 如果前端页面仍然为空，可能的问题：');
    console.log('1. 前端组件没有正确调用API');
    console.log('2. Redux状态管理有问题');
    console.log('3. 组件渲染逻辑有问题');
    console.log('4. 网络请求被浏览器拦截');
    
    console.log('\n📱 调试建议：');
    console.log('1. 打开浏览器开发者工具');
    console.log('2. 查看Network标签页，确认API请求是否发送');
    console.log('3. 查看Console标签页，是否有JavaScript错误');
    console.log('4. 检查Redux DevTools，查看状态变化');
    console.log('5. 在AdminOverview组件中添加console.log调试');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 认证问题，请检查：');
      console.log('1. token是否正确设置');
      console.log('2. 后端认证中间件是否正常');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 连接问题，请检查：');
      console.log('1. 后端服务是否启动');
      console.log('2. 端口5000是否被占用');
    }
  }
}

testFrontendAPI(); 