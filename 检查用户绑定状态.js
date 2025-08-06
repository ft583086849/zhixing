const https = require('https');

async function makeRequest(hostname, path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkUserBinding() {
  console.log('🔍 检查用户绑定状态\n');

  try {
    // 1. 登录管理员
    console.log('1. 登录管理员账户...');
    const loginData = {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    };

    const loginResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/auth?path=login',
      'POST',
      loginData
    );

    if (!loginResult.data.success) {
      throw new Error(`管理员登录失败: ${loginResult.data.message}`);
    }

    const authToken = loginResult.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 获取所有订单，查看用户绑定情况
    console.log('\n2. 获取订单列表，检查用户绑定...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (!ordersResult.data.success) {
      throw new Error(`获取订单失败: ${ordersResult.data.message}`);
    }

    const orders = ordersResult.data.data.orders;
    console.log(`✅ 获取到 ${orders.length} 个订单`);

    // 3. 分析用户绑定情况
    console.log('\n3. 分析用户绑定情况...');
    const userBindings = {};
    
    orders.forEach(order => {
      const username = order.tradingview_username;
      if (!userBindings[username]) {
        userBindings[username] = [];
      }
      userBindings[username].push({
        id: order.id,
        status: order.status,
        duration: order.duration,
        sales_wechat: order.sales_wechat_name || '未知销售',
        created_at: order.created_at
      });
    });

    console.log('📊 用户绑定分析：');
    Object.entries(userBindings).forEach(([username, userOrders]) => {
      console.log(`\n👤 用户: ${username}`);
      console.log(`   订单数量: ${userOrders.length}`);
      userOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. 订单${order.id} - ${order.duration} - ${order.status} - ${order.sales_wechat} - ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      });
      
      // 检查是否有非取消状态的订单
      const activeOrders = userOrders.filter(o => o.status !== 'cancelled');
      if (activeOrders.length > 1) {
        console.log(`   ⚠️  该用户有 ${activeOrders.length} 个有效订单，可能触发重复绑定检查`);
      }
    });

    // 4. 提供解决建议
    console.log('\n🔍 重复绑定问题分析：');
    console.log('业务逻辑：');
    console.log('• 7天免费订单：只检查是否用过免费期');
    console.log('• 付费订单：不允许同一用户名有多个订单（避免重复绑定）');
    console.log('');
    console.log('可能的解决方案：');
    console.log('1. 使用不同的TradingView用户名下单');
    console.log('2. 取消之前的订单（将状态改为cancelled）');
    console.log('3. 修改业务逻辑允许同一销售链接下的重复订单');
    console.log('4. 修改业务逻辑允许续费或升级');

    // 5. 检查特定用户的情况（如果有的话）
    console.log('\n💡 建议：');
    const suspiciousUsers = Object.entries(userBindings).filter(([username, orders]) => {
      const activeOrders = orders.filter(o => o.status !== 'cancelled');
      return activeOrders.length > 1;
    });

    if (suspiciousUsers.length > 0) {
      console.log('发现可能触发重复绑定的用户：');
      suspiciousUsers.forEach(([username, orders]) => {
        console.log(`• ${username}: ${orders.filter(o => o.status !== 'cancelled').length} 个有效订单`);
      });
    } else {
      console.log('所有用户都只有一个有效订单，重复绑定检查正常。');
      console.log('如果仍然出现错误，可能是：');
      console.log('• 缓存问题');
      console.log('• 数据库同步延迟');
      console.log('• 前端提交了重复请求');
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

checkUserBinding();