const https = require('https');

async function apiCall(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && {'Content-Length': Buffer.byteLength(postData)})
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
            success: response.success !== undefined ? response.success : res.statusCode < 400,
            message: response.message || '',
            data: response.data || response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: res.statusCode < 400,
            message: responseData,
            data: null
          });
        }
      });
    });

    req.on('error', (error) => reject(error));
    if (postData) req.write(postData);
    req.end();
  });
}

async function checkSalesDataIntegrity() {
  console.log('🔍 检查销售数据完整性...\n');

  try {
    // 1. 管理员登录
    console.log('1. 管理员登录...');
    const loginResult = await apiCall('POST', '/api/auth?path=login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!loginResult.success) {
      console.log('❌ 登录失败');
      return;
    }
    console.log('✅ 登录成功\n');

    // 2. 检查一级销售数据
    console.log('2. 检查一级销售数据...');
    const primaryResult = await apiCall('GET', '/api/primary-sales?path=list');
    
    if (primaryResult.success) {
      console.log(`✅ 一级销售查询成功，共 ${primaryResult.data.length} 条记录`);
      primaryResult.data.forEach((sales, index) => {
        console.log(`   [${index + 1}] ID: ${sales.id}, 微信: ${sales.wechat_name}`);
        console.log(`       销售代码: ${sales.sales_code || '❌ 缺失'}`);
        console.log(`       注册代码: ${sales.secondary_registration_code || '❌ 缺失'}`);
        console.log(`       佣金率: ${sales.commission_rate || '❌ 缺失'}%`);
        console.log(`       收款方式: ${sales.payment_method || '❌ 缺失'}`);
        console.log(`       收款地址: ${sales.payment_address || '❌ 缺失'}`);
        console.log('');
      });
    } else {
      console.log('❌ 一级销售查询失败:', primaryResult.message);
    }

    // 3. 检查二级销售数据
    console.log('3. 检查二级销售数据...');
    const secondaryResult = await apiCall('GET', '/api/admin?path=sales');
    
    if (secondaryResult.success) {
      const secondarySales = secondaryResult.data.filter(s => s.sales_type === 'secondary');
      console.log(`✅ 二级销售查询成功，共 ${secondarySales.length} 条记录`);
      secondarySales.forEach((sales, index) => {
        console.log(`   [${index + 1}] ID: ${sales.id}, 微信: ${sales.wechat_name}`);
        console.log(`       销售代码: ${sales.sales_code || '❌ 缺失'}`);
        console.log(`       上级销售: ${sales.primary_sales_name || sales.primary_sales_id || '独立销售'}`);
        console.log(`       佣金率: ${sales.commission_rate || '❌ 缺失'}%`);
        console.log(`       收款方式: ${sales.payment_method || '❌ 缺失'}`);
        console.log(`       收款地址: ${sales.payment_address || '❌ 缺失'}`);
        console.log('');
      });
    } else {
      console.log('❌ 二级销售查询失败:', secondaryResult.message);
    }

    // 4. 检查订单数据
    console.log('4. 检查现有订单数据...');
    const ordersResult = await apiCall('GET', '/api/orders?path=list');
    
    if (ordersResult.success) {
      console.log(`✅ 订单查询成功，共 ${ordersResult.data.length} 条记录`);
      ordersResult.data.slice(0, 5).forEach((order, index) => {
        console.log(`   [${index + 1}] 订单ID: ${order.id}`);
        console.log(`       销售代码: ${order.sales_code || order.link_code || '❌ 缺失'}`);
        console.log(`       客户微信: ${order.customer_wechat}`);
        console.log(`       订单金额: $${order.amount || '❌ 缺失'}`);
        console.log(`       订单状态: ${order.status || '❌ 缺失'}`);
        console.log('');
      });
    } else {
      console.log('❌ 订单查询失败:', ordersResult.message);
    }

    console.log('🎉 销售数据完整性检查完成！');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

checkSalesDataIntegrity();