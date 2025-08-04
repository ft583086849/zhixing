const https = require('https');

const API_BASE = 'https://zhixing-seven.vercel.app/api';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ data: parsed, status: res.statusCode });
        } catch (e) {
          resolve({ data: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createCompleteTestData() {
  console.log('🚀 开始创建完整管理员测试数据...\n');

  try {
    // 1. 创建一级销售
    console.log('📊 步骤1: 创建一级销售...');
    const primarySalesData = {
      wechat_name: '一级销售张三',
      payment_method: 'alipay',
      payment_address: 'zhangsanpay@example.com',
      alipay_surname: '张三',
      chain_name: '测试链名'
    };

    const primaryResult = await makeRequest('POST', '/primary-sales?path=create', primarySalesData);
    
    if (primaryResult.data.success) {
      const primary = primaryResult.data.data;
      console.log(`✅ 一级销售创建成功:`);
      console.log(`   销售代码: ${primary.sales_code}`);
      console.log(`   注册代码: ${primary.secondary_registration_code}\n`);

      // 2. 使用注册代码创建二级销售
      console.log('📊 步骤2: 创建二级销售...');
      const secondaryData = {
        wechat_name: '二级销售李四',
        registration_code: primary.secondary_registration_code,
        payment_method: 'crypto',
        payment_address: 'bc1qexample123456789',
        chain_name: 'BTC'
      };

      const secondaryResult = await makeRequest('POST', '/secondary-sales?path=register', secondaryData);
      
      if (secondaryResult.data.success) {
        const secondary = secondaryResult.data.data;
        console.log(`✅ 二级销售创建成功:`);
        console.log(`   销售代码: ${secondary.sales_code}\n`);

        // 3. 创建多个订单（用于测试不同状态和时间范围）
        console.log('📊 步骤3: 创建测试订单...');
        
        const orderTests = [
          {
            name: '一级销售订单1-7天免费',
            sales_code: primary.sales_code,
            data: {
              sales_code: primary.sales_code,
              tradingview_username: 'user001',
              customer_wechat: 'customer001',
              duration: 7,
              amount: 0,
              payment_method: 'free',
              payment_time: new Date().toISOString(),
              purchase_type: '7天免费版本'
            }
          },
          {
            name: '一级销售订单2-付费版',
            sales_code: primary.sales_code,
            data: {
              sales_code: primary.sales_code,
              tradingview_username: 'user002',
              customer_wechat: 'customer002',
              duration: 30,
              amount: 299,
              payment_method: 'alipay',
              payment_time: new Date().toISOString(),
              purchase_type: '30天版本'
            }
          },
          {
            name: '二级销售订单1',
            sales_code: secondary.sales_code,
            data: {
              sales_code: secondary.sales_code,
              tradingview_username: 'user003',
              customer_wechat: 'customer003',
              duration: 30,
              amount: 299,
              payment_method: 'crypto',
              payment_time: new Date().toISOString(),
              purchase_type: '30天版本'
            }
          },
          {
            name: '一级销售订单3-大额',
            sales_code: primary.sales_code,
            data: {
              sales_code: primary.sales_code,
              tradingview_username: 'user004',
              customer_wechat: 'customer004',
              duration: 365,
              amount: 1999,
              payment_method: 'alipay',
              payment_time: new Date().toISOString(),
              purchase_type: '365天版本'
            }
          }
        ];

        for (let i = 0; i < orderTests.length; i++) {
          const test = orderTests[i];
          console.log(`   创建订单: ${test.name}...`);
          
          try {
            const orderResult = await makeRequest('POST', '/orders?path=create', test.data);
            if (orderResult.data.success) {
              console.log(`   ✅ ${test.name} 创建成功 (ID: ${orderResult.data.data.order_id})`);
            } else {
              console.log(`   ❌ ${test.name} 创建失败: ${orderResult.data.message}`);
            }
          } catch (error) {
            console.log(`   ❌ ${test.name} 创建错误: ${error.message}`);
          }
          
          // 添加小延迟避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n🎉 完整测试数据创建完成!');
        console.log('\n📋 可用于测试的信息:');
        console.log(`🔹 一级销售代码: ${primary.sales_code}`);
        console.log(`🔹 二级销售代码: ${secondary.sales_code}`);
        console.log(`🔹 注册代码: ${primary.secondary_registration_code}`);
        console.log(`🔹 用户购买链接: https://zhixing-seven.vercel.app/purchase?sales_code=${primary.sales_code}`);
        console.log(`🔹 二级销售注册链接: https://zhixing-seven.vercel.app/secondary-sales?sales_code=${primary.secondary_registration_code}`);
        console.log(`🔹 管理员页面: https://zhixing-seven.vercel.app/admin`);

      } else {
        console.log(`❌ 二级销售创建失败: ${secondaryResult.data.message}`);
      }
    } else {
      console.log(`❌ 一级销售创建失败: ${primaryResult.data.message}`);
    }

  } catch (error) {
    console.error('💥 创建测试数据时发生错误:', error);
  }
}

// 运行测试
createCompleteTestData();