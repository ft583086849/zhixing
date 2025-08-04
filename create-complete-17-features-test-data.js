const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '17-Features-Test-Data'
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

// 生成不同时间的订单数据
function generateOrderTimes() {
  const now = new Date();
  const times = [];
  
  // 今天
  times.push({
    date: now.toISOString().split('T')[0],
    time: '10:30:00',
    label: '今天'
  });
  
  // 本周
  const thisWeek = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  times.push({
    date: thisWeek.toISOString().split('T')[0],
    time: '14:20:00',
    label: '本周'
  });
  
  // 本月
  const thisMonth = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  times.push({
    date: thisMonth.toISOString().split('T')[0],
    time: '09:15:00',
    label: '本月'
  });
  
  // 上月
  const lastMonth = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
  times.push({
    date: lastMonth.toISOString().split('T')[0],
    time: '16:45:00',
    label: '上月'
  });
  
  // 本年
  const thisYear = new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000);
  times.push({
    date: thisYear.toISOString().split('T')[0],
    time: '11:30:00',
    label: '本年'
  });
  
  return times;
}

async function create17FeaturesTestData() {
  console.log('🚀 创建17个功能的完整测试数据\n');
  console.log('📋 测试需求:');
  console.log('   - 1个一级销售 + 5个下挂二级销售');
  console.log('   - 一级销售直接订单: 5个');
  console.log('   - 每个下挂二级销售订单: 5个 (共25个)');
  console.log('   - 2个独立二级销售，每个2个订单 (共4个)');
  console.log('   - 不同时间分布的订单数据');
  console.log('   - 总计订单: 34个\n');

  const results = {
    primarySales: [],
    secondarySales: [],
    independentSales: [],
    orders: [],
    errors: []
  };

  const orderTimes = generateOrderTimes();
  let timeIndex = 0;

  try {
    // 1. 创建1个一级销售
    console.log('📋 步骤1: 创建一级销售');
    const primaryData = {
      wechat_name: `17功能测试一级销售_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'primary-17test@alipay.com',
      alipay_surname: '测',
      chain_name: null
    };

    const primaryResult = await makeRequest('https://zhixing-seven.vercel.app/api/primary-sales?path=create', primaryData);
    if (primaryResult.data.success) {
      results.primarySales.push(primaryResult.data.data);
      console.log(`✅ 一级销售创建成功: ${primaryResult.data.data.user_sales_code}`);
      
      // 2. 创建5个下挂二级销售
      console.log('\n📋 步骤2: 创建5个下挂二级销售');
      for (let i = 1; i <= 5; i++) {
        const secondaryData = {
          registration_code: primaryResult.data.data.secondary_registration_code,
          wechat_name: `17功能测试二级销售${i}_${Date.now()}`,
          payment_method: i % 2 === 0 ? 'crypto' : 'alipay',
          payment_address: i % 2 === 0 ? 'bc1q17test' + i : `secondary${i}-17test@alipay.com`,
          alipay_surname: i % 2 === 0 ? null : `测${i}`,
          chain_name: i % 2 === 0 ? 'Bitcoin' : null
        };

        const secondaryResult = await makeRequest('https://zhixing-seven.vercel.app/api/secondary-sales?path=register', secondaryData);
        if (secondaryResult.data.success) {
          results.secondarySales.push(secondaryResult.data.data);
          console.log(`✅ 下挂二级销售${i}创建成功: ${secondaryResult.data.data.user_sales_code}`);
        } else {
          results.errors.push(`下挂二级销售${i}创建失败: ${secondaryResult.data.message}`);
        }
      }

      // 3. 为一级销售创建5个直接订单
      console.log('\n📋 步骤3: 为一级销售创建5个直接订单');
      for (let i = 1; i <= 5; i++) {
        const timeData = orderTimes[timeIndex % orderTimes.length];
        const durations = ['1month', '3months', '6months', 'lifetime'];
        const amounts = [188, 488, 688, 1288];
        
        const orderData = {
          sales_code: primaryResult.data.data.user_sales_code,
          tradingview_username: `primary_user_${i}_${Date.now()}`,
          customer_wechat: `primary_customer_${i}_${Date.now()}`,
          duration: durations[i % 4],
          amount: amounts[i % 4],
          payment_method: 'alipay',
          payment_time: `${timeData.date} ${timeData.time}`,
          purchase_type: 'immediate'
        };

        const orderResult = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
        if (orderResult.data.success) {
          results.orders.push({
            orderId: orderResult.data.data.order_id,
            salesCode: primaryResult.data.data.user_sales_code,
            type: '一级销售直接订单',
            amount: orderData.amount,
            time: `${timeData.date} ${timeData.time}`,
            timeLabel: timeData.label
          });
          console.log(`✅ 一级销售订单${i}创建成功 (${timeData.label})`);
        } else {
          results.errors.push(`一级销售订单${i}创建失败: ${orderResult.data.message}`);
        }
        timeIndex++;
      }

      // 4. 为每个下挂二级销售创建5个订单
      console.log('\n📋 步骤4: 为每个下挂二级销售创建5个订单');
      for (let secIndex = 0; secIndex < results.secondarySales.length; secIndex++) {
        const secondary = results.secondarySales[secIndex];
        console.log(`\\n  为二级销售${secIndex + 1}创建订单...`);
        
        for (let orderIndex = 1; orderIndex <= 5; orderIndex++) {
          const timeData = orderTimes[timeIndex % orderTimes.length];
          const durations = ['1month', '3months', '6months', 'lifetime'];
          const amounts = [188, 488, 688, 1288];
          
          const orderData = {
            sales_code: secondary.user_sales_code,
            tradingview_username: `sec${secIndex + 1}_user_${orderIndex}_${Date.now()}`,
            customer_wechat: `sec${secIndex + 1}_customer_${orderIndex}_${Date.now()}`,
            duration: durations[orderIndex % 4],
            amount: amounts[orderIndex % 4],
            payment_method: orderIndex % 2 === 0 ? 'crypto' : 'alipay',
            payment_time: `${timeData.date} ${timeData.time}`,
            purchase_type: 'immediate'
          };

          const orderResult = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
          if (orderResult.data.success) {
            results.orders.push({
              orderId: orderResult.data.data.order_id,
              salesCode: secondary.user_sales_code,
              type: `二级销售${secIndex + 1}订单`,
              amount: orderData.amount,
              time: `${timeData.date} ${timeData.time}`,
              timeLabel: timeData.label
            });
            console.log(`  ✅ 二级销售${secIndex + 1}订单${orderIndex}创建成功 (${timeData.label})`);
          } else {
            results.errors.push(`二级销售${secIndex + 1}订单${orderIndex}创建失败: ${orderResult.data.message}`);
          }
          timeIndex++;
        }
      }
    } else {
      results.errors.push(`一级销售创建失败: ${primaryResult.data.message}`);
    }

    // 5. 创建2个独立二级销售
    console.log('\n📋 步骤5: 创建2个独立二级销售');
    for (let i = 1; i <= 2; i++) {
      const independentData = {
        wechat_name: `17功能测试独立二级${i}_${Date.now()}`,
        payment_method: i === 1 ? 'alipay' : 'crypto',
        payment_address: i === 1 ? `independent${i}-17test@alipay.com` : 'bc1q17testindependent',
        alipay_surname: i === 1 ? `独${i}` : null,
        chain_name: i === 1 ? null : 'Bitcoin'
      };

      const independentResult = await makeRequest('https://zhixing-seven.vercel.app/api/sales?path=create', independentData);
      if (independentResult.data.success) {
        results.independentSales.push(independentResult.data.data);
        console.log(`✅ 独立二级销售${i}创建成功: ${independentResult.data.data.link_code}`);
        
        // 6. 为每个独立二级销售创建2个订单
        console.log(`\\n  为独立二级销售${i}创建订单...`);
        for (let orderIndex = 1; orderIndex <= 2; orderIndex++) {
          const timeData = orderTimes[timeIndex % orderTimes.length];
          const durations = ['3months', '6months'];
          const amounts = [488, 688];
          
          const orderData = {
            sales_code: independentResult.data.data.link_code,
            tradingview_username: `indep${i}_user_${orderIndex}_${Date.now()}`,
            customer_wechat: `indep${i}_customer_${orderIndex}_${Date.now()}`,
            duration: durations[(orderIndex - 1) % 2],
            amount: amounts[(orderIndex - 1) % 2],
            payment_method: 'alipay',
            payment_time: `${timeData.date} ${timeData.time}`,
            purchase_type: 'immediate'
          };

          const orderResult = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
          if (orderResult.data.success) {
            results.orders.push({
              orderId: orderResult.data.data.order_id,
              salesCode: independentResult.data.data.link_code,
              type: `独立二级销售${i}订单`,
              amount: orderData.amount,
              time: `${timeData.date} ${timeData.time}`,
              timeLabel: timeData.label
            });
            console.log(`  ✅ 独立二级销售${i}订单${orderIndex}创建成功 (${timeData.label})`);
          } else {
            results.errors.push(`独立二级销售${i}订单${orderIndex}创建失败: ${orderResult.data.message}`);
          }
          timeIndex++;
        }
      } else {
        results.errors.push(`独立二级销售${i}创建失败: ${independentResult.data.message}`);
      }
    }

  } catch (error) {
    results.errors.push(`脚本执行错误: ${error.message}`);
  }

  // 最终报告
  console.log('\\n📊 17功能测试数据创建完成报告');
  console.log('='.repeat(60));
  console.log(`✅ 一级销售: ${results.primarySales.length}个`);
  console.log(`✅ 下挂二级销售: ${results.secondarySales.length}个`);
  console.log(`✅ 独立二级销售: ${results.independentSales.length}个`);
  console.log(`✅ 订单总数: ${results.orders.length}个`);
  console.log(`❌ 错误: ${results.errors.length}个`);

  if (results.errors.length > 0) {
    console.log('\\n❌ 错误详情:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // 按时间分组统计
  console.log('\\n📅 订单时间分布:');
  const timeGroups = {};
  results.orders.forEach(order => {
    if (!timeGroups[order.timeLabel]) {
      timeGroups[order.timeLabel] = 0;
    }
    timeGroups[order.timeLabel]++;
  });
  
  Object.entries(timeGroups).forEach(([timeLabel, count]) => {
    console.log(`   ${timeLabel}: ${count}个订单`);
  });

  console.log('\\n🎯 测试17个功能的数据已准备完成！');
  console.log('现在可以测试:');
  console.log('1. 管理员页面数据概览 - 验证新增指标');
  console.log('2. 时间范围筛选 - 验证不同时间段的订单');
  console.log('3. 佣金比率显示 - 验证40%/30%佣金');
  console.log('4. 一级销售分销管理 - 验证催单和搜索功能');
  console.log('5. 客户管理标签 - 验证"客户微信号"显示');
  console.log('6. 订单管理 - 验证销售微信号显示和操作按钮');

  return results;
}

create17FeaturesTestData().catch(console.error);