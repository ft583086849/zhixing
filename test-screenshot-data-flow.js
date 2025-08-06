const https = require('https');

async function testScreenshotDataFlow() {
  console.log('🔍 测试截图数据传递链路...\n');

  try {
    // 1. 获取管理员token
    console.log('1. 获取管理员token...');
    const loginData = JSON.stringify({
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });

    const loginResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/auth?path=login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              resolve(result.data.token);
            } else {
              reject(new Error(`登录失败: ${result.message}`));
            }
          } catch (e) {
            reject(new Error(`JSON解析错误: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('✅ 管理员登录成功');

    // 2. 创建一个带Base64截图的测试订单
    console.log('\n2. 创建带Base64截图的测试订单...');
    
    // 创建一个简单的Base64图片数据（1x1透明PNG）
    const testBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHBu0dkiQAAAABJRU5ErkJggg==';
    
    const orderData = JSON.stringify({
      sales_code: 'PS4TESTCODE',  // 假设的销售代码
      tradingview_username: `screenshot_test_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      purchase_type: 'immediate',
      alipay_amount: 188,
      screenshot_data: testBase64Image,
      customer_wechat: 'test_wechat'
    });

    console.log(`   Base64数据长度: ${testBase64Image.length} 字符`);
    console.log(`   Base64数据开头: ${testBase64Image.substring(0, 50)}...`);

    const createOrderResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': orderData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              status: res.statusCode,
              result: result
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              result: { error: `JSON解析错误: ${e.message}`, raw: data }
            });
          }
        });
      });

      req.on('error', reject);
      req.write(orderData);
      req.end();
    });

    console.log(`   订单创建状态码: ${createOrderResult.status}`);
    
    if (createOrderResult.result.success) {
      const orderId = createOrderResult.result.data.order_id;
      console.log(`✅ 订单创建成功，ID: ${orderId}`);
      console.log(`   包含截图: ${createOrderResult.result.data.has_screenshot ? '是' : '否'}`);

      // 3. 通过管理员API查询订单，验证截图数据是否正确存储
      console.log('\n3. 查询订单验证截图数据...');
      
      const queryResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'zhixing-seven.vercel.app',
          port: 443,
          path: `/api/admin?path=orders&page=1&limit=5`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult}`
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (e) {
              reject(new Error(`JSON解析错误: ${e.message}`));
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      if (queryResult.success) {
        const orders = queryResult.data.orders;
        const targetOrder = orders.find(order => order.id === orderId);
        
        if (targetOrder) {
          console.log(`✅ 找到目标订单，ID: ${targetOrder.id}`);
          console.log(`   截图数据存在: ${targetOrder.screenshot_path ? '是' : '否'}`);
          
          if (targetOrder.screenshot_path) {
            console.log(`   截图数据长度: ${targetOrder.screenshot_path.length} 字符`);
            console.log(`   截图数据格式: ${targetOrder.screenshot_path.startsWith('data:image/') ? '✅ Base64格式正确' : '❌ 格式错误'}`);
            console.log(`   截图数据开头: ${targetOrder.screenshot_path.substring(0, 50)}...`);
            
            // 验证数据完整性
            if (targetOrder.screenshot_path === testBase64Image) {
              console.log('✅ 截图数据完全一致，传递链路正常');
            } else {
              console.log('⚠️  截图数据不完全一致，可能被截断或修改');
            }
          } else {
            console.log('❌ 截图数据丢失');
          }
        } else {
          console.log('❌ 未找到目标订单');
        }
      } else {
        console.log(`❌ 查询订单失败: ${queryResult.message}`);
      }

    } else {
      console.log(`❌ 订单创建失败: ${createOrderResult.result.message || '未知错误'}`);
      console.log(`   详细响应: ${JSON.stringify(createOrderResult.result)}`);
    }

    console.log('\n🎉 截图数据传递链路测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testScreenshotDataFlow();