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

async function diagnoseFrontendIssue() {
  console.log('🔍 诊断前端提交问题（后端已确认正常）\n');

  try {
    // 1. 检查前端可能使用的不同数据格式
    console.log('1. 测试前端可能的数据格式问题...');
    
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

    const authToken = loginResult.data.data.token;
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const testSales = salesResult.data.data.sales[0];
    console.log(`使用销售代码: ${testSales.sales_code}`);

    // 2. 测试可能的前端数据格式差异
    console.log('\n2. 🧪 测试可能的前端数据格式...');
    
    const testScenarios = [
      {
        name: '标准格式（刚才成功的）',
        data: {
          sales_code: testSales.sales_code,
          link_code: testSales.sales_code,
          tradingview_username: `standard_${Date.now()}`,
          customer_wechat: `standard_wechat_${Date.now()}`,
          duration: '1month',
          amount: 188,
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          effective_time: null,
          alipay_amount: '1340',
          crypto_amount: null,
          screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      },
      {
        name: '缺少link_code（可能前端bug）',
        data: {
          sales_code: testSales.sales_code,
          tradingview_username: `nolink_${Date.now()}`,
          customer_wechat: `nolink_wechat_${Date.now()}`,
          duration: '1month',
          amount: 188,
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          alipay_amount: '1340',
          screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      },
      {
        name: '字符串数字格式',
        data: {
          sales_code: testSales.sales_code,
          link_code: testSales.sales_code,
          tradingview_username: `stringnum_${Date.now()}`,
          customer_wechat: `stringnum_wechat_${Date.now()}`,
          duration: '1month',
          amount: '188', // 字符串而不是数字
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          alipay_amount: '1340',
          screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      },
      {
        name: '空effective_time（可能前端设置）',
        data: {
          sales_code: testSales.sales_code,
          link_code: testSales.sales_code,
          tradingview_username: `emptyeffective_${Date.now()}`,
          customer_wechat: `emptyeffective_wechat_${Date.now()}`,
          duration: '1month',
          amount: 188,
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          effective_time: '', // 空字符串而不是null
          alipay_amount: '1340',
          screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      },
      {
        name: '大截图数据（可能导致问题）',
        data: {
          sales_code: testSales.sales_code,
          link_code: testSales.sales_code,
          tradingview_username: `bigimage_${Date.now()}`,
          customer_wechat: `bigimage_wechat_${Date.now()}`,
          duration: '1month',
          amount: 188,
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          alipay_amount: '1340',
          screenshot_data: 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='.repeat(10) // 重复10次模拟大图
        }
      }
    ];

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n   测试场景 ${i + 1}: ${scenario.name}`);
      
      const testResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        scenario.data
      );

      console.log(`   结果: ${testResult.status}`);
      if (testResult.data?.success) {
        console.log(`   ✅ 成功 - 订单ID: ${testResult.data.data?.order_id}`);
      } else {
        console.log(`   ❌ 失败 - ${testResult.data?.message || '未知错误'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. 检查重复绑定问题
    console.log('\n3. 🔍 测试重复绑定问题...');
    
    // 使用一个已存在的用户名
    const existingUser = 'TestUser2025'; // 之前测试中使用过的
    console.log(`   使用已存在用户: ${existingUser}`);
    
    const repeatData = {
      sales_code: testSales.sales_code,
      link_code: testSales.sales_code,
      tradingview_username: existingUser,
      customer_wechat: 'repeat_test_wechat',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '1340',
      screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    const repeatResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      repeatData
    );

    console.log(`   重复用户测试: ${repeatResult.status}`);
    if (!repeatResult.data?.success) {
      console.log(`   ❌ 重复绑定被阻止: ${repeatResult.data?.message}`);
      if (repeatResult.data?.message?.includes('跨销售绑定') || 
          repeatResult.data?.message?.includes('销售绑定')) {
        console.log('   💡 这可能是您遇到的问题！');
      }
    } else {
      console.log(`   ✅ 同销售续费成功`);
    }

    // 4. 测试不同销售的跨绑定
    if (salesResult.data.data.sales.length > 1) {
      console.log('\n4. 🚫 测试跨销售绑定...');
      const differentSales = salesResult.data.data.sales[1];
      
      const crossSalesData = {
        sales_code: differentSales.sales_code,
        link_code: differentSales.sales_code,
        tradingview_username: existingUser,
        customer_wechat: 'cross_test_wechat',
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: '1340',
        screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      const crossResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        crossSalesData
      );

      console.log(`   跨销售测试: ${crossResult.status}`);
      if (!crossResult.data?.success) {
        console.log(`   ❌ 跨销售被阻止: ${crossResult.data?.message}`);
      }
    }

    console.log('\n📋 前端问题诊断结果:');
    console.log('🔍 可能的问题原因:');
    console.log('1. 浏览器缓存 - 使用旧版本前端代码');
    console.log('2. 重复用户名 - 之前用过的TradingView用户名');
    console.log('3. 销售链接错误 - 使用了错误的sales_code');
    console.log('4. 表单验证 - 前端表单验证阻止提交');
    console.log('5. 网络超时 - 提交过程中网络中断');
    
    console.log('\n💡 解决建议:');
    console.log('1. 清除浏览器缓存并刷新（Ctrl+F5）');
    console.log('2. 使用全新的TradingView用户名');
    console.log('3. 检查浏览器控制台的JavaScript错误');
    console.log('4. 尝试不同的浏览器');
    console.log('5. 检查网络连接');

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

diagnoseFrontendIssue();