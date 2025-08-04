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

async function createBasicOrderData() {
  console.log('🚀 使用ps_95创建基础订单数据...\n');

  const PRIMARY_SALES_CODE = 'ps_95';

  const orderTests = [
    {
      name: '7天免费订单',
      data: {
        sales_code: PRIMARY_SALES_CODE,
        tradingview_username: 'freeuser001',
        customer_wechat: 'freecustomer001',
        duration: 7,
        amount: 0,
        payment_method: 'free',
        payment_time: new Date().toISOString(),
        purchase_type: '7天免费版本'
      }
    },
    {
      name: '30天付费订单',
      data: {
        sales_code: PRIMARY_SALES_CODE,
        tradingview_username: 'paiduser001',
        customer_wechat: 'paidcustomer001',
        duration: 30,
        amount: 299,
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        purchase_type: '30天版本'
      }
    },
    {
      name: '365天年费订单',
      data: {
        sales_code: PRIMARY_SALES_CODE,
        tradingview_username: 'yearuser001',
        customer_wechat: 'yearcustomer001',
        duration: 365,
        amount: 1999,
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        purchase_type: '365天版本'
      }
    },
    {
      name: '加密货币付费订单',
      data: {
        sales_code: PRIMARY_SALES_CODE,
        tradingview_username: 'cryptouser001',
        customer_wechat: 'cryptocustomer001',
        duration: 90,
        amount: 799,
        payment_method: 'crypto',
        payment_time: new Date().toISOString(),
        purchase_type: '90天版本'
      }
    },
    {
      name: '测试配置确认订单',
      data: {
        sales_code: PRIMARY_SALES_CODE,
        tradingview_username: 'configuser001',
        customer_wechat: 'configcustomer001',
        duration: 30,
        amount: 299,
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        purchase_type: '30天版本'
      }
    }
  ];

  for (let i = 0; i < orderTests.length; i++) {
    const test = orderTests[i];
    console.log(`📊 创建订单: ${test.name}...`);
    
    try {
      const orderResult = await makeRequest('POST', '/orders?path=create', test.data);
      if (orderResult.data.success) {
        console.log(`✅ ${test.name} 创建成功 (ID: ${orderResult.data.data.order_id})`);
      } else {
        console.log(`❌ ${test.name} 创建失败: ${orderResult.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} 创建错误: ${error.message}`);
    }
    
    // 添加小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 基础订单数据创建完成!');
  console.log('\n📋 测试信息:');
  console.log(`🔹 一级销售代码: ${PRIMARY_SALES_CODE}`);
  console.log(`🔹 注册代码: reg_95`);
  console.log(`🔹 用户购买链接: https://zhixing-seven.vercel.app/purchase?sales_code=${PRIMARY_SALES_CODE}`);
  console.log(`🔹 二级销售注册链接: https://zhixing-seven.vercel.app/secondary-sales?sales_code=reg_95`);
  console.log(`🔹 管理员页面: https://zhixing-seven.vercel.app/admin`);
}

createBasicOrderData();