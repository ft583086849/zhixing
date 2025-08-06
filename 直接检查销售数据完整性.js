const https = require('https');

async function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && {'Content-Length': Buffer.byteLength(postData)}),
        ...(token && {'Authorization': `Bearer ${token}`})
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
            data: response.data || response,
            token: response.token || null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: res.statusCode < 400,
            message: responseData,
            data: null,
            token: null
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
  console.log('🔍 直接检查销售数据完整性...\n');

  try {
    // 1. 管理员登录获取token
    console.log('1. 管理员登录...');
    const loginResult = await apiCall('POST', '/api/auth?path=login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!loginResult.success) {
      console.log('❌ 登录失败:', loginResult.message);
      return;
    }
    
    const token = loginResult.token;
    console.log('✅ 登录成功，获得token\n');

    // 2. 通过管理员API检查销售数据
    console.log('2. 检查销售数据（通过管理员API）...');
    const salesResult = await apiCall('GET', '/api/admin?path=sales', null, token);
    
    if (salesResult.success && salesResult.data) {
      console.log(`✅ 销售数据查询成功，共 ${salesResult.data.length} 条记录`);
      
      // 分析一级销售数据
      const primarySales = salesResult.data.filter(s => s.sales_type === 'primary');
      console.log(`   一级销售: ${primarySales.length} 条`);
      
      if (primarySales.length > 0) {
        console.log('\n📋 一级销售详细信息:');
        primarySales.forEach((sales, index) => {
          console.log(`   [${index + 1}] ID: ${sales.id}`);
          console.log(`       微信名: ${sales.wechat_name || '❌ 缺失'}`);
          console.log(`       销售代码: ${sales.sales_code || '❌ 缺失'}`);
          console.log(`       佣金率: ${sales.commission_rate || '❌ 缺失'}%`);
          console.log(`       收款方式: ${sales.payment_method || '❌ 缺失'}`);
          console.log(`       收款地址: ${sales.payment_address || '❌ 缺失'}`);
          console.log(`       注册代码: ${sales.secondary_registration_code || '❌ 缺失'}`);
          console.log('');
        });
      }
      
      // 分析二级销售数据
      const secondarySales = salesResult.data.filter(s => s.sales_type === 'secondary');
      console.log(`   二级销售: ${secondarySales.length} 条`);
      
      if (secondarySales.length > 0) {
        console.log('\n📋 二级销售详细信息（前3条）:');
        secondarySales.slice(0, 3).forEach((sales, index) => {
          console.log(`   [${index + 1}] ID: ${sales.id}`);
          console.log(`       微信名: ${sales.wechat_name || '❌ 缺失'}`);
          console.log(`       销售代码: ${sales.sales_code || '❌ 缺失'}`);
          console.log(`       上级销售: ${sales.primary_sales_name || '独立销售'}`);
          console.log(`       佣金率: ${sales.commission_rate || '❌ 缺失'}%`);
          console.log(`       收款方式: ${sales.payment_method || '❌ 缺失'}`);
          console.log(`       收款地址: ${sales.payment_address || '❌ 缺失'}`);
          console.log('');
        });
      }
      
    } else {
      console.log('❌ 销售数据查询失败:', salesResult.message);
    }

    // 3. 检查订单数据中的sales_code关联
    console.log('3. 检查订单中的sales_code关联...');
    const ordersResult = await apiCall('GET', '/api/orders?path=list', null, token);
    
    if (ordersResult.success && ordersResult.data) {
      console.log(`✅ 订单数据查询成功，共 ${ordersResult.data.length} 条记录`);
      
      if (ordersResult.data.length > 0) {
        console.log('\n📋 订单sales_code分析（前5条）:');
        ordersResult.data.slice(0, 5).forEach((order, index) => {
          console.log(`   [${index + 1}] 订单ID: ${order.id}`);
          console.log(`       sales_code: ${order.sales_code || order.link_code || '❌ 缺失'}`);
          console.log(`       客户微信: ${order.customer_wechat}`);
          console.log(`       订单金额: $${order.amount || '❌ 缺失'}`);
          console.log(`       订单状态: ${order.status || '❌ 缺失'}`);
          console.log('');
        });
      }
      
    } else {
      console.log('❌ 订单数据查询失败:', ordersResult.message);
    }

    console.log('🎉 销售数据完整性检查完成！');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

checkSalesDataIntegrity();