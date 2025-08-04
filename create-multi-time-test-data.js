const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multi-Time-Test-Data-Creator'
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

// 生成不同时间的日期
function generateTestDates() {
  const now = new Date();
  const dates = [];
  
  // 今天 (2个订单)
  dates.push({
    label: '今天',
    date: now,
    count: 2
  });
  
  // 昨天 (3个订单)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  dates.push({
    label: '昨天', 
    date: yesterday,
    count: 3
  });
  
  // 3天前 (2个订单)
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  dates.push({
    label: '3天前',
    date: threeDaysAgo, 
    count: 2
  });
  
  // 1周前 (4个订单)
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  dates.push({
    label: '1周前',
    date: oneWeekAgo,
    count: 4
  });
  
  // 2周前 (3个订单)
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  dates.push({
    label: '2周前',
    date: twoWeeksAgo,
    count: 3
  });
  
  // 1个月前 (5个订单)
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  dates.push({
    label: '1个月前',
    date: oneMonthAgo,
    count: 5
  });
  
  // 2个月前 (3个订单)
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  dates.push({
    label: '2个月前',
    date: twoMonthsAgo,
    count: 3
  });
  
  // 6个月前 (2个订单)
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  dates.push({
    label: '6个月前',
    date: sixMonthsAgo,
    count: 2
  });
  
  return dates;
}

// 获取现有销售代码
async function getExistingSalesCodes() {
  // 使用之前成功创建的销售代码，避免网络问题
  const knownSalesCodes = [
    { code: 'abe9cddd8f384afa', wechat: '一级销售_1754090214', type: 'primary' },
    { code: '120585949d5b4ff9', wechat: '挂名二级_1754090214', type: 'secondary' },
    { code: 'ba5963467057450d', wechat: '独立二级1_1754090214', type: 'secondary' },
    { code: 'a2783708452447db', wechat: '独立二级2_1754090214', type: 'secondary' },
    { code: '40ba106fc9944ad4', wechat: '测试销售_1753860352', type: 'secondary' }
  ];
  
  console.log(`✅ 使用已知的 ${knownSalesCodes.length} 个销售代码`);
  knownSalesCodes.forEach(sale => {
    console.log(`   - ${sale.code} (${sale.wechat}, ${sale.type})`);
  });
  
  return knownSalesCodes;
}

// 创建多时间维度订单
async function createMultiTimeOrders() {
  console.log('🚀 开始创建多时间维度测试数据\n');
  
  const salesCodes = await getExistingSalesCodes();
  if (salesCodes.length === 0) {
    console.log('❌ 没有可用的销售代码，无法创建订单');
    return;
  }
  
  const testDates = generateTestDates();
  const durations = ['1month', '3months', '6months', 'lifetime'];
  const statuses = ['pending_payment', 'pending_config', 'confirmed_payment', 'confirmed_configuration'];
  const amounts = [188, 488, 888, 1888];
  
  let totalCreated = 0;
  let totalErrors = 0;
  const createdByDate = {};
  
  for (const dateInfo of testDates) {
    console.log(`📅 创建 ${dateInfo.label} 的订单 (${dateInfo.count}个)...`);
    createdByDate[dateInfo.label] = 0;
    
    for (let i = 0; i < dateInfo.count; i++) {
      try {
        // 随机选择销售代码
        const salesCode = salesCodes[Math.floor(Math.random() * salesCodes.length)];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        
        // 生成唯一的用户名（基于时间戳）
        const timestamp = dateInfo.date.getTime() + i;
        const username = `test_user_${dateInfo.label.replace(/[^a-zA-Z0-9]/g, '')}_${i + 1}_${timestamp}`;
        
        // 构造订单数据
        const orderData = {
          sales_code: salesCode.code,
          tradingview_username: username,
          customer_wechat: `customer_${timestamp}`,
          duration: duration,
          amount: amount,
          payment_method: Math.random() > 0.5 ? 'alipay' : 'crypto',
          payment_time: dateInfo.date.toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: Math.random() > 0.3 ? 'immediate' : 'advance',
          alipay_amount: Math.random() > 0.5 ? (amount * 7).toFixed(2) : null,
          crypto_amount: Math.random() > 0.5 ? amount.toString() : null
        };
        
        // 创建订单
        const result = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
        
        if (result.data.success) {
          console.log(`   ✅ 订单${i + 1}创建成功 (${duration}, $${amount}, ${salesCode.wechat})`);
          totalCreated++;
          createdByDate[dateInfo.label]++;
          
          // 如果需要更新状态到特定状态，可以在这里添加
          if (status !== 'pending_payment') {
            // 这里可以调用更新状态的API
            // 为了简化，我们先跳过状态更新
          }
        } else {
          console.log(`   ❌ 订单${i + 1}创建失败: ${result.data.message || '未知错误'}`);
          totalErrors++;
        }
        
        // 短暂延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`   ❌ 订单${i + 1}创建异常: ${error.message}`);
        totalErrors++;
      }
    }
    
    console.log(`   📊 ${dateInfo.label}完成: ${createdByDate[dateInfo.label]}/${dateInfo.count}个订单\n`);
  }
  
  // 验证创建结果
  console.log('📊 多时间维度测试数据创建完成!');
  console.log('='.repeat(50));
  console.log(`✅ 总成功: ${totalCreated}个订单`);
  console.log(`❌ 总失败: ${totalErrors}个订单`);
  console.log('');
  console.log('📅 按时间分布:');
  Object.entries(createdByDate).forEach(([date, count]) => {
    console.log(`   ${date}: ${count}个订单`);
  });
  
  // 等待一下再验证数据
  console.log('\n⏳ 等待数据生效...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 验证管理员统计数据
  console.log('\n🔍 验证管理员统计数据...');
  try {
    // 验证今天的数据
    const todayStats = await makeRequest('https://zhixing-seven.vercel.app/api/admin?path=stats&timeRange=today');
    console.log('今天统计:', todayStats.data);
    
    // 验证本周的数据  
    const weekStats = await makeRequest('https://zhixing-seven.vercel.app/api/admin?path=stats&timeRange=week');
    console.log('本周统计:', weekStats.data);
    
    // 验证本月的数据
    const monthStats = await makeRequest('https://zhixing-seven.vercel.app/api/admin?path=stats&timeRange=month');
    console.log('本月统计:', monthStats.data);
    
  } catch (error) {
    console.log('❌ 验证统计数据失败:', error.message);
  }
  
  console.log('\n🎯 现在可以测试以下功能:');
  console.log('   ✅ 数据概览页面 - 时间筛选 (今天/本周/本月/本年)');
  console.log('   ✅ 订单管理页面 - 销售微信号显示');
  console.log('   ✅ 销售管理页面 - 数据显示');
  console.log('   ✅ 客户管理页面 - 数据显示');
  console.log('   ✅ 各种统计指标验证');
}

// 执行创建
createMultiTimeOrders().catch(console.error);