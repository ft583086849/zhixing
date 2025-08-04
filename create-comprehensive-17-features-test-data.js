const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Data-Creator'
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

function generateWechatName(prefix) {
  const suffixes = ['小张', '小李', '小王', '小刘', '小陈', '小赵', '小孙', '小周', '小吴', '小郑', '小杨', '小何', '小高', '小林', '小黄'];
  return `${prefix}_${suffixes[Math.floor(Math.random() * suffixes.length)]}_${Date.now() + Math.floor(Math.random() * 1000)}`;
}

function generateRandomData() {
  const methods = ['alipay', 'wechat', 'crypto'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  
  const base = {
    payment_method: method
  };

  if (method === 'alipay') {
    base.payment_address = `alipay_${Math.random().toString(36).substr(2, 8)}@example.com`;
    base.alipay_surname = ['张', '李', '王', '刘', '陈', '赵'][Math.floor(Math.random() * 6)];
  } else if (method === 'wechat') {
    base.payment_address = `wx_${Math.random().toString(36).substr(2, 10)}`;
  } else {
    base.payment_address = `0x${Math.random().toString(16).substr(2, 40)}`;
    base.chain_name = ['BTC', 'ETH', 'USDT'][Math.floor(Math.random() * 3)];
  }

  return base;
}

async function createPrimarySales() {
  console.log('🏆 创建一级销售...');
  
  const primaryData = {
    wechat_name: generateWechatName('一级销售'),
    ...generateRandomData()
  };

  try {
    const result = await makeRequest('https://zhixing-seven.vercel.app/api/primary-sales?path=create', primaryData);
    
    if (result.data.success) {
      console.log(`   ✅ 一级销售创建成功: ${primaryData.wechat_name}`);
      console.log(`   📱 二级销售注册链接: ${result.data.data.secondary_registration_link}`);
      console.log(`   🛒 用户购买链接: ${result.data.data.user_sales_link}`);
      return {
        primary: result.data.data,
        secondary_registration_code: result.data.data.secondary_registration_code,
        user_sales_code: result.data.data.user_sales_code
      };
    } else {
      console.log(`   ❌ 一级销售创建失败: ${result.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 一级销售创建错误: ${error.message}`);
    return null;
  }
}

async function createSecondaryUnderPrimary(primaryCodes, count = 5) {
  console.log(`\\n👥 创建${count}个二级销售（挂在一级销售下）...`);
  console.log(`   🔍 使用secondary_registration_code: ${primaryCodes.secondary_registration_code}`);
  const secondarySales = [];

  for (let i = 0; i < count; i++) {
    const secondaryData = {
      wechat_name: generateWechatName('二级销售'),
      registration_code: primaryCodes.secondary_registration_code, // 修正字段名
      ...generateRandomData()
    };

    try {
      const result = await makeRequest('https://zhixing-seven.vercel.app/api/secondary-sales?path=register', secondaryData);
      
      if (result.data.success) {
        console.log(`   ✅ 二级销售 ${i+1} 创建成功: ${secondaryData.wechat_name}`);
        console.log(`   📱 生成的sales_code: ${result.data.data.sales_code}`);
        secondarySales.push({
          ...result.data.data,
          sales_code: result.data.data.sales_code,
          wechat_name: result.data.data.wechat_name
        });
      } else {
        console.log(`   ❌ 二级销售 ${i+1} 创建失败: ${result.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ 二级销售 ${i+1} 创建错误: ${error.message}`);
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return secondarySales;
}

async function createIndependentSecondarySales(count = 5) {
  console.log(`\\n🆓 创建${count}个独立二级销售...`);
  const independentSales = [];

  for (let i = 0; i < count; i++) {
    const salesData = {
      wechat_name: generateWechatName('独立二级'),
      ...generateRandomData()
    };

    try {
      const result = await makeRequest('https://zhixing-seven.vercel.app/api/sales?path=create', salesData);
      
      if (result.data.success) {
        console.log(`   ✅ 独立二级销售 ${i+1} 创建成功: ${salesData.wechat_name}`);
        console.log(`   📱 生成的sales_code: ${result.data.link_code || result.data.sales_code}`);
        independentSales.push({
          ...result.data,
          sales_code: result.data.link_code || result.data.sales_code,
          wechat_name: salesData.wechat_name
        });
      } else {
        console.log(`   ❌ 独立二级销售 ${i+1} 创建失败: ${result.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ 独立二级销售 ${i+1} 创建错误: ${error.message}`);
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return independentSales;
}

async function createOrders(salesCode, salesName, count = 5, orderType = '用户订单') {
  console.log(`\\n📝 为 ${salesName} 创建${count}个${orderType}...`);
  console.log(`   🔍 使用sales_code: ${salesCode}`);
  const orders = [];

  for (let i = 0; i < count; i++) {
    const orderData = {
      sales_code: salesCode, // 使用新的字段名
      tradingview_username: `user_${Math.random().toString(36).substr(2, 8)}`,
      customer_wechat: `客户微信_${Math.random().toString(36).substr(2, 6)}`,
      duration: [30, 90, 365][Math.floor(Math.random() * 3)],
      amount: [299, 599, 999, 1999][Math.floor(Math.random() * 4)],
      payment_method: ['alipay', 'wechat', 'crypto'][Math.floor(Math.random() * 3)],
      payment_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 过去30天内随机时间
      purchase_type: Math.random() > 0.8 ? 'free_trial' : 'paid',
      effective_time: new Date().toISOString(),
      expiry_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      alipay_amount: Math.floor(Math.random() * 2000) + 100,
      crypto_amount: (Math.random() * 0.1 + 0.01).toFixed(6),
      commission_amount: Math.floor(Math.random() * 300) + 50
    };

    try {
      const result = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
      
      if (result.data.success) {
        console.log(`   ✅ ${orderType} ${i+1} 创建成功: ${orderData.tradingview_username}`);
        orders.push(result.data);
      } else {
        console.log(`   ❌ ${orderType} ${i+1} 创建失败: ${result.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ${orderType} ${i+1} 创建错误: ${error.message}`);
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return orders;
}

async function createComprehensiveTestData() {
  console.log('🚀 开始创建17功能测试数据\\n');
  console.log('='.repeat(70));

  // 1. 创建一级销售
  const primaryResult = await createPrimarySales();
  if (!primaryResult) {
    console.log('❌ 一级销售创建失败，无法继续');
    return;
  }

  // 2. 为一级销售创建5个用户订单
  await createOrders(
    primaryResult.user_sales_code, 
    primaryResult.primary.wechat_name, 
    5, 
    '一级销售用户订单'
  );

  // 3. 创建5个二级销售（挂在一级销售下）
  const secondaryUnderPrimary = await createSecondaryUnderPrimary(primaryResult, 5);

  // 4. 为一级销售下的每个二级销售创建5个订单
  for (let i = 0; i < secondaryUnderPrimary.length; i++) {
    const secondary = secondaryUnderPrimary[i];
    if (secondary && secondary.sales_code) {
      await createOrders(
        secondary.sales_code, 
        secondary.wechat_name, 
        5, 
        `二级销售订单`
      );
    }
  }

  // 5. 创建5个独立二级销售
  const independentSecondary = await createIndependentSecondarySales(5);

  // 6. 为每个独立二级销售创建5个订单
  for (let i = 0; i < independentSecondary.length; i++) {
    const independent = independentSecondary[i];
    if (independent && independent.sales_code) {
      await createOrders(
        independent.sales_code, 
        independent.wechat_name, 
        5, 
        `独立二级销售订单`
      );
    }
  }

  console.log('\\n🎉 测试数据创建完成！');
  console.log('='.repeat(70));
  console.log('📊 数据统计:');
  console.log(`   • 一级销售: 1个`);
  console.log(`   • 一级销售用户订单: 5个`);
  console.log(`   • 二级销售（挂一级下）: ${secondaryUnderPrimary.length}个`);
  console.log(`   • 二级销售订单: ${secondaryUnderPrimary.length * 5}个`);
  console.log(`   • 独立二级销售: ${independentSecondary.length}个`);
  console.log(`   • 独立二级销售订单: ${independentSecondary.length * 5}个`);
  console.log(`   • 总订单数: ${5 + secondaryUnderPrimary.length * 5 + independentSecondary.length * 5}个`);

  console.log('\\n🔗 重要链接:');
  console.log(`   📱 二级销售注册: ${primaryResult.primary.secondary_registration_link}`);
  console.log(`   🛒 用户购买链接: ${primaryResult.primary.user_sales_link}`);
  console.log('\\n🔗 测试页面链接:');
  console.log('   📱 管理员控制台: https://zhixing-seven.vercel.app/#/admin/dashboard');
  console.log('   🏆 一级销售注册: https://zhixing-seven.vercel.app/#/primary-sales');
  console.log('   📊 一级销售分销管理: https://zhixing-seven.vercel.app/#/sales/commission');
  console.log('   💰 二级销售对账: https://zhixing-seven.vercel.app/#/sales/settlement');
  
  return {
    primary: primaryResult,
    secondaryUnderPrimary,
    independentSecondary,
    totalOrders: 5 + secondaryUnderPrimary.length * 5 + independentSecondary.length * 5
  };
}

// 执行数据创建
createComprehensiveTestData().catch(console.error);