const axios = require('axios');

async function testFrontendNetwork() {
  console.log('🌐 测试前端网络请求\n');
  
  try {
    // 1. 测试前端页面加载
    console.log('1️⃣ 测试前端页面加载...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端页面加载正常');
    
    // 2. 测试后端API直接访问
    console.log('\n2️⃣ 测试后端API直接访问...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ 后端健康检查正常');
    
    // 3. 测试CORS预检请求
    console.log('\n3️⃣ 测试CORS预检请求...');
    try {
      const corsResponse = await axios.options('http://localhost:5000/api/admin/stats', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization'
        }
      });
      console.log('✅ CORS预检请求正常');
      console.log('CORS Headers:', corsResponse.headers);
    } catch (error) {
      console.log('⚠️  CORS预检请求失败，但可能不影响正常请求');
    }
    
    // 4. 模拟前端API调用
    console.log('\n4️⃣ 模拟前端API调用...');
    
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取token');
    
    // 模拟前端API调用（使用相同的配置）
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 测试统计数据API
    const statsResponse = await api.get('/admin/stats');
    console.log('✅ 统计数据API调用成功');
    console.log('返回数据:', statsResponse.data);
    
    // 5. 测试浏览器环境下的API调用
    console.log('\n5️⃣ 测试浏览器环境下的API调用...');
    
    // 模拟浏览器的fetch请求
    const fetchResponse = await fetch('http://localhost:5000/api/admin/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (fetchResponse.ok) {
      const fetchData = await fetchResponse.json();
      console.log('✅ Fetch API调用成功');
      console.log('返回数据:', fetchData);
    } else {
      console.log('❌ Fetch API调用失败');
    }
    
    console.log('\n🎉 网络测试完成！');
    console.log('\n📋 如果前端页面仍然为空，可能的原因：');
    console.log('1. 前端组件没有正确调用API');
    console.log('2. Redux状态管理有问题');
    console.log('3. 组件渲染逻辑有问题');
    console.log('4. 浏览器缓存问题');
    
    console.log('\n🔧 建议的调试步骤：');
    console.log('1. 打开浏览器开发者工具');
    console.log('2. 查看Network标签页，确认API请求是否发送');
    console.log('3. 查看Console标签页，是否有JavaScript错误');
    console.log('4. 检查Redux DevTools，查看状态变化');
    console.log('5. 强制刷新页面 (Ctrl+Shift+R)');
    console.log('6. 清除浏览器缓存');
    
  } catch (error) {
    console.error('❌ 网络测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 连接被拒绝，请检查：');
      console.log('1. 后端服务是否启动：cd server && npm start');
      console.log('2. 前端服务是否启动：cd client && npm start');
      console.log('3. 端口是否被占用');
    } else if (error.response) {
      console.log('\n🔧 HTTP错误，状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
    }
  }
}

testFrontendNetwork(); 