const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Final-Test-Data'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createFinalTestData() {
  console.log('🚀 创建最终完整测试数据\n');
  
  const results = {
    primarySales: [],
    secondarySales: [],
    orders: [],
    errors: []
  };

  try {
    // 1. 创建一级销售
    console.log('📋 步骤1: 创建1个一级销售');
    const primarySalesData = {
      wechat_name: `一级销售_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'primary@alipay.com',
      alipay_surname: '张',
      chain_name: null
    };

    const primaryResult = await makeRequest('https://zhixing-seven.vercel.app/api/primary-sales?path=create', primarySalesData);
    if (primaryResult.data.success) {
      results.primarySales.push(primaryResult.data.data);
      console.log(`✅ 一级销售创建成功: ${primaryResult.data.data.user_sales_code}`);
      
      // 2. 创建挂名二级销售
      console.log('\n📋 步骤2: 创建1个挂名二级销售');
      const secondaryData = {
        registration_code: primaryResult.data.data.secondary_registration_code,
        wechat_name: `挂名二级销售_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: 'secondary1@alipay.com',
        alipay_surname: '李',
        chain_name: null
      };

      const secondaryResult = await makeRequest('https://zhixing-seven.vercel.app/api/secondary-sales?path=register', secondaryData);
      if (secondaryResult.data.success) {
        results.secondarySales.push(secondaryResult.data.data);
        console.log(`✅ 挂名二级销售创建成功: ${secondaryResult.data.data.user_sales_code}`);
      } else {
        results.errors.push(`挂名二级销售创建失败: ${secondaryResult.data.message}`);
      }
    } else {
      results.errors.push(`一级销售创建失败: ${primaryResult.data.message}`);
    }

    // 3. 创建2个独立二级销售
    console.log('\n📋 步骤3: 创建2个独立二级销售');
    for (let i = 1; i <= 2; i++) {
      const independentData = {
        wechat_name: `独立二级销售${i}_${Date.now()}`,
        payment_method: i === 1 ? 'alipay' : 'crypto',
        payment_address: i === 1 ? `independent${i}@alipay.com` : 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        alipay_surname: i === 1 ? '王' : null,
        chain_name: i === 1 ? null : 'Bitcoin'
      };

      const result = await makeRequest('https://zhixing-seven.vercel.app/api/sales?path=create', independentData);
      if (result.data.success) {
        results.secondarySales.push(result.data.data);
        console.log(`✅ 独立二级销售${i}创建成功: ${result.data.data.link_code}`);
      } else {
        results.errors.push(`独立二级销售${i}创建失败: ${result.data.message}`);
      }
    }

    // 4. 创建订单 (现在应该可以正常工作)
    console.log('\n📋 步骤4: 创建测试订单');
    
    const allSalesCodes = [
      ...results.primarySales.map(p => p.user_sales_code),
      ...results.secondarySales.map(s => s.user_sales_code || s.link_code)
    ].filter(Boolean);

    let orderIndex = 1;
    for (const salesCode of allSalesCodes) {
      // 为每个销售创建1-2个订单
      const numOrders = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numOrders; i++) {
        const orderData = {
          sales_code: salesCode,
          tradingview_username: `test_user_${orderIndex}_${Date.now()}`,
          customer_wechat: `customer_${orderIndex}_${Date.now()}`,
          duration: ['1month', '3months', '6months', 'lifetime'][orderIndex % 4],
          amount: [188, 488, 688, 1288][orderIndex % 4],
          payment_method: 'alipay',
          payment_time: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
          purchase_type: 'immediate'
        };

        const orderResult = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
        if (orderResult.data.success) {
          results.orders.push({
            orderId: orderResult.data.data.order_id,
            salesCode: salesCode,
            amount: orderData.amount,
            duration: orderData.duration
          });
          console.log(`✅ 订单${orderIndex}创建成功 (销售码: ${salesCode})`);
        } else {
          results.errors.push(`订单${orderIndex}创建失败: ${orderResult.data.message}`);
          console.log(`❌ 订单${orderIndex}创建失败: ${orderResult.data.message}`);
        }
        
        orderIndex++;
      }
    }

    // 5. 验证数据
    console.log('\n📋 步骤5: 验证创建的数据');
    
    // 检查销售数据
    const salesCheck = await makeRequest('https://zhixing-seven.vercel.app/api/sales');
    if (salesCheck.data.success) {
      console.log(`✅ 销售数据验证: 当前共有 ${salesCheck.data.data.length} 个销售`);
    }

    // 检查管理员页面数据
    const adminCheck = await makeRequest('https://zhixing-seven.vercel.app/api/admin/sales');
    if (adminCheck.status === 200) {
      console.log('✅ 管理员销售数据可访问');
    }

  } catch (error) {
    results.errors.push(`脚本执行错误: ${error.message}`);
    console.error('❌ 脚本执行失败:', error.message);
  }

  // 最终报告
  console.log('\n📊 测试数据创建完成报告');
  console.log('='.repeat(50));
  console.log(`✅ 一级销售: ${results.primarySales.length}个`);
  console.log(`✅ 二级销售: ${results.secondarySales.length}个`);
  console.log(`✅ 订单: ${results.orders.length}个`);
  console.log(`❌ 错误: ${results.errors.length}个`);

  if (results.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n🎯 数据概览页面测试:');
  console.log('   - 可以验证总订单数、各状态订单数');
  console.log('   - 可以验证待返佣金金额指标');
  console.log('   - 可以验证订单分类统计');

  console.log('\n🎯 销售管理页面测试:');
  console.log('   - 可以验证佣金比率筛选功能');
  console.log('   - 可以验证销售链接位置');

  console.log('\n🎯 一级销售分销管理页面测试:');
  console.log('   - 可以验证催单数据字段展示');
  console.log('   - 可以验证微信号/链接代码查询功能');

  console.log('\n✨ 所有功能现在都可以用真实数据进行测试！');

  return results;
}

createFinalTestData().catch(console.error);