const https = require('https');

// 管理员登录获取token
async function getAdminToken() {
  const loginData = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.token) {
            resolve(response.data.token);
          } else {
            reject(new Error(`登录失败: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`登录响应解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// API调用函数
async function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ 
            status: res.statusCode, 
            success: response.success, 
            data: response.data, 
            message: response.message,
            rawResponse: responseData
          });
        } catch (error) {
          resolve({ 
            status: res.statusCode, 
            success: false, 
            error: `响应解析失败: ${error.message}`, 
            rawResponse: responseData 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: `网络错误: ${error.message}` });
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 测试订单创建完整链路
async function testOrderCreationChain() {
  console.log('🎯 测试P0核心：订单创建完整业务链路...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 获取可用的销售代码
    console.log('2. 获取现有销售代码...');
    
    // 获取一级销售
    const primaryResult = await apiCall('GET', '/api/primary-sales?path=list', null, token);
    console.log(`一级销售查询: ${primaryResult.success ? '成功' : '失败'}`);
    
    // 获取二级销售
    const secondaryResult = await apiCall('GET', '/api/secondary-sales?path=list', null, token);
    console.log(`二级销售查询: ${secondaryResult.success ? '成功' : '失败'}`);
    
    if (!primaryResult.success && !secondaryResult.success) {
      console.log('❌ 无法获取销售数据，退出测试');
      return;
    }

    // 准备测试的销售代码
    const testCases = [];
    
    if (primaryResult.success && primaryResult.data && primaryResult.data.length > 0) {
      const primarySales = primaryResult.data[0];
      testCases.push({
        type: '一级销售',
        sales_code: primarySales.sales_code,
        wechat_name: primarySales.wechat_name,
        expected_layer: 'primary'
      });
    }
    
    if (secondaryResult.success && secondaryResult.data && secondaryResult.data.length > 0) {
      const secondarySales = secondaryResult.data[0];
      testCases.push({
        type: '二级销售',
        sales_code: secondarySales.sales_code,
        wechat_name: secondarySales.wechat_name,
        expected_layer: 'secondary'
      });
    }

    if (testCases.length === 0) {
      console.log('❌ 没有可测试的销售代码');
      return;
    }

    console.log(`✅ 找到 ${testCases.length} 个可测试的销售代码\n`);

    // 3. 测试订单创建
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`3.${i+1} 测试${testCase.type}订单创建...`);
      console.log(`     销售代码: ${testCase.sales_code}`);
      console.log(`     销售微信: ${testCase.wechat_name}`);

      const timestamp = Date.now() + i;
      const orderData = {
        customer_name: `测试用户${timestamp}`,
        customer_phone: `1380000${timestamp % 10000}`,
        customer_wechat: `test_${timestamp}`,
        duration: '1month',
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        sales_code: testCase.sales_code,
        alipay_amount: '188',
        screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      console.log(`     订单数据: ${testCase.type}用户购买1个月，188美元`);

      const orderResult = await apiCall('POST', '/api/orders?path=create', orderData);
      
      console.log(`📋 订单创建结果:`);
      console.log(`     状态: ${orderResult.status}`);
      console.log(`     成功: ${orderResult.success}`);
      console.log(`     消息: ${orderResult.message || '无消息'}`);
      
      if (orderResult.success && orderResult.data) {
        console.log(`     订单ID: ${orderResult.data.id}`);
        console.log(`✅ ${testCase.type}订单创建成功`);

        // 4. 验证订单是否出现在管理员系统
        console.log(`4.${i+1} 验证订单是否传到管理员系统...`);
        
        const adminOrdersResult = await apiCall('GET', '/api/admin?path=orders', null, token);
        
        if (adminOrdersResult.success && adminOrdersResult.data) {
          const createdOrder = adminOrdersResult.data.find(order => order.id === orderResult.data.id);
          
          if (createdOrder) {
            console.log(`✅ 订单已成功传到管理员系统`);
            console.log(`     管理员系统显示:`);
            console.log(`       - 订单ID: ${createdOrder.id}`);
            console.log(`       - 客户: ${createdOrder.customer_name}`);
            console.log(`       - 销售微信: ${createdOrder.sales_wechat || '未关联'}`);
            console.log(`       - 销售代码: ${createdOrder.sales_code || '未关联'}`);
            console.log(`       - 金额: $${createdOrder.amount || '未知'}`);
            console.log(`       - 佣金关联: ${createdOrder.primary_sales_id || createdOrder.secondary_sales_id ? '已关联' : '未关联'}`);
            
            // 检查分佣关系
            if (createdOrder.primary_sales_id) {
              console.log(`       - 一级销售ID: ${createdOrder.primary_sales_id}`);
            }
            if (createdOrder.secondary_sales_id) {
              console.log(`       - 二级销售ID: ${createdOrder.secondary_sales_id}`);
            }
            
            if (!createdOrder.sales_wechat || !createdOrder.sales_code) {
              console.log(`⚠️  订单销售关联信息缺失`);
            }
            
            if (!createdOrder.primary_sales_id && !createdOrder.secondary_sales_id) {
              console.log(`❌ 分佣关系未正确记录`);
            }
            
          } else {
            console.log(`❌ 订单未出现在管理员系统中`);
          }
        } else {
          console.log(`❌ 无法获取管理员订单列表`);
        }
        
      } else {
        console.log(`❌ ${testCase.type}订单创建失败`);
        if (orderResult.error) {
          console.log(`     错误: ${orderResult.error}`);
        }
        console.log(`     原始响应: ${orderResult.rawResponse?.substring(0, 200) || '无响应'}`);
      }
      
      console.log(''); // 空行分隔
    }

    console.log('🎉 订单创建链路测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程失败:', error.message);
  }
}

// 执行测试
testOrderCreationChain();