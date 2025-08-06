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

async function checkOrderSalesFields() {
  console.log('🔍 检查订单表中的销售关联字段\n');

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

    // 2. 获取订单数据，分析销售关联字段
    console.log('\n2. 获取订单数据，分析销售关联字段...');
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

    // 3. 分析每个订单的销售关联字段
    console.log('\n3. 分析订单销售关联字段使用情况：');
    console.log('订单ID | TradingView用户 | sales_code | link_code | primary_sales_id | secondary_sales_id | 销售微信');
    console.log('-------|----------------|------------|-----------|------------------|---------------------|----------');
    
    orders.forEach(order => {
      const display = {
        id: order.id,
        username: order.tradingview_username?.substring(0, 15) + '...' || 'N/A',
        sales_code: order.sales_code || 'NULL',
        link_code: order.link_code || 'NULL', 
        primary_sales_id: order.primary_sales_id || 'NULL',
        secondary_sales_id: order.secondary_sales_id || 'NULL',
        sales_wechat: order.sales_wechat_name || 'NULL'
      };
      
      console.log(`${display.id.toString().padEnd(7)} | ${display.username.padEnd(15)} | ${display.sales_code.padEnd(10)} | ${display.link_code.padEnd(9)} | ${display.primary_sales_id.toString().padEnd(16)} | ${display.secondary_sales_id.toString().padEnd(19)} | ${display.sales_wechat}`);
    });

    // 4. 统计字段使用情况
    console.log('\n4. 字段使用统计：');
    const stats = {
      sales_code: 0,
      link_code: 0,
      primary_sales_id: 0,
      secondary_sales_id: 0,
      total: orders.length
    };

    orders.forEach(order => {
      if (order.sales_code) stats.sales_code++;
      if (order.link_code) stats.link_code++;
      if (order.primary_sales_id) stats.primary_sales_id++;
      if (order.secondary_sales_id) stats.secondary_sales_id++;
    });

    console.log(`📊 销售关联字段统计（共${stats.total}个订单）：`);
    console.log(`• sales_code: ${stats.sales_code} 个订单使用 (${(stats.sales_code/stats.total*100).toFixed(1)}%)`);
    console.log(`• link_code: ${stats.link_code} 个订单使用 (${(stats.link_code/stats.total*100).toFixed(1)}%)`);
    console.log(`• primary_sales_id: ${stats.primary_sales_id} 个订单使用 (${(stats.primary_sales_id/stats.total*100).toFixed(1)}%)`);
    console.log(`• secondary_sales_id: ${stats.secondary_sales_id} 个订单使用 (${(stats.secondary_sales_id/stats.total*100).toFixed(1)}%)`);

    // 5. 分析匹配逻辑的必要性
    console.log('\n5. 💡 多种匹配方式的作用：');
    
    if (stats.sales_code > 0 && stats.link_code > 0) {
      console.log('✅ 需要同时支持 sales_code 和 link_code（新旧标准兼容）');
    } else if (stats.sales_code > 0) {
      console.log('• 主要使用 sales_code（新标准）');
    } else if (stats.link_code > 0) {
      console.log('• 主要使用 link_code（旧标准）');
    }
    
    if (stats.primary_sales_id > 0) {
      console.log('✅ 需要支持 primary_sales_id 匹配（一级销售直接关联）');
    }
    
    if (stats.secondary_sales_id > 0) {
      console.log('✅ 需要支持 secondary_sales_id 匹配（二级销售直接关联）');
    }

    console.log('\n📋 匹配逻辑示例：');
    console.log('当用户尝试用销售代码 "ABC123" 下单时，系统会检查：');
    console.log('1. existingOrder.sales_code === "ABC123"  （新标准匹配）');
    console.log('2. existingOrder.link_code === "ABC123"   （旧标准兼容）');
    console.log('3. existingOrder.primary_sales_id === 当前销售的ID   （一级销售ID匹配）');
    console.log('4. existingOrder.secondary_sales_id === 当前销售的ID （二级销售ID匹配）');
    console.log('');
    console.log('✅ 如果任何一种方式匹配成功 → 同一销售续费（允许）');
    console.log('❌ 如果没有任何方式匹配 → 跨销售绑定（禁止）');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

checkOrderSalesFields();