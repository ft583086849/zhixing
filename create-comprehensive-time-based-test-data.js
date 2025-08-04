/**
 * 综合测试数据创建脚本
 * 目标：为管理员页面创建按时间范围分布的测试数据
 * 包含：订单管理、销售管理、客户管理所需的全面数据
 */

const https = require('https');

// 配置
const API_BASE = 'https://zhixing-seven.vercel.app/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// 日志函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString().substring(11, 19);
  const typeColors = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    progress: colors.cyan,
    important: colors.bold + colors.yellow
  };
  console.log(`${typeColors[type]}[${timestamp}] ${message}${colors.reset}`);
};

// 生成时间范围数据
const generateTimeRanges = () => {
  const now = new Date();
  
  return {
    today: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: now,
      label: '今天',
      orderCount: 5
    },
    week: {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: '本周',
      orderCount: 12
    },
    month: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
      label: '本月', 
      orderCount: 25
    },
    custom: {
      start: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      label: '自定义范围（15天前-5天前）',
      orderCount: 8
    }
  };
};

// 生成随机时间
const generateRandomTime = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
};

// 生成微信号
const generateWechatName = (prefix, index) => {
  const suffixes = ['_test', '_demo', '_verify', '_check', '_valid'];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${index}${randomSuffix}_${Date.now()}`;
};

// 创建API请求函数
const makeRequest = async (endpoint, data = null, description = '') => {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Comprehensive-Test-Data'
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
          if (parsed.success) {
            log(`✅ ${description} - 成功`, 'success');
            resolve({ success: true, data: parsed });
          } else {
            log(`❌ ${description} - 失败: ${parsed.message}`, 'error');
            resolve({ success: false, error: parsed.message });
          }
        } catch (e) {
          log(`❌ ${description} - 解析错误: ${responseData}`, 'error');
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ ${description} - 网络错误: ${error.message}`, 'error');
      resolve({ success: false, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// 1. 创建一级销售
const createPrimarySales = async (count = 3) => {
  log(`\n=== 创建${count}个一级销售 ===`, 'important');
  const primarySales = [];
  
  for (let i = 1; i <= count; i++) {
    const salesData = {
      wechat_name: generateWechatName('一级销售', i),
      payment_method: i % 2 === 0 ? 'alipay' : 'crypto',
      payment_address: i % 2 === 0 ? '752304285@qq.com' : 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
      alipay_surname: i % 2 === 0 ? '梁' : undefined,
      chain_name: i % 2 === 0 ? undefined : 'TRC20'
    };
    
    const result = await makeRequest(
      '/primary-sales?path=create', 
      salesData, 
      `一级销售${i}创建`
    );
    
    if (result.success) {
      primarySales.push({
        ...result.data,
        index: i
      });
      log(`   📝 一级销售${i}: ${salesData.wechat_name}`, 'info');
    }
  }
  
  return primarySales;
};

// 2. 创建独立二级销售
const createIndependentSecondarySales = async (count = 3) => {
  log(`\n=== 创建${count}个独立二级销售 ===`, 'important');
  const secondarySales = [];
  
  for (let i = 1; i <= count; i++) {
    const salesData = {
      wechat_name: generateWechatName('独立二级', i),
      payment_method: i % 2 === 0 ? 'crypto' : 'alipay',
      payment_address: i % 2 === 0 ? 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo' : '752304285@qq.com',
      alipay_surname: i % 2 === 0 ? undefined : '梁',
      chain_name: i % 2 === 0 ? 'TRC20' : undefined
    };
    
    const result = await makeRequest(
      '/sales?path=create', 
      salesData, 
      `独立二级销售${i}创建`
    );
    
    if (result.success) {
      secondarySales.push({
        ...result.data,
        index: i
      });
      log(`   📝 独立二级销售${i}: ${salesData.wechat_name}`, 'info');
    }
  }
  
  return secondarySales;
};

// 3. 创建按时间范围分布的订单
const createTimeBasedOrders = async (salesList, timeRanges) => {
  log(`\n=== 创建按时间范围分布的订单 ===`, 'important');
  const allOrders = [];
  
  // 订单模板数据
  const orderTemplates = [
    { duration: '7days', amount: 0, label: '7天免费' },
    { duration: '1month', amount: 188, label: '1个月' },
    { duration: '3months', amount: 488, label: '3个月' },
    { duration: '6months', amount: 688, label: '6个月' },
    { duration: 'lifetime', amount: 1888, label: '终身' }
  ];
  
  // 订单状态分布（用于测试不同确认流程）
  const statusDistribution = [
    { status: 'pending_payment', config_confirmed: false, weight: 2 },
    { status: 'confirmed_payment', config_confirmed: false, weight: 2 },
    { status: 'pending_config', config_confirmed: false, weight: 3 },
    { status: 'confirmed_configuration', config_confirmed: true, weight: 3 }
  ];
  
  for (const [timeKey, timeRange] of Object.entries(timeRanges)) {
    log(`\n📅 创建${timeRange.label}的订单 (${timeRange.orderCount}个)`, 'progress');
    
    for (let orderIndex = 1; orderIndex <= timeRange.orderCount; orderIndex++) {
      // 随机选择销售
      const randomSales = salesList[Math.floor(Math.random() * salesList.length)];
      if (!randomSales?.data) continue;
      
      // 获取销售代码（一级销售用sales_code，二级销售用link_code）
      const salesCode = randomSales.data.sales_code || randomSales.data.link_code;
      if (!salesCode) continue;
      
      // 随机选择订单模板
      const template = orderTemplates[Math.floor(Math.random() * orderTemplates.length)];
      
      // 生成时间
      const paymentTime = generateRandomTime(timeRange.start, timeRange.end);
      const submitTime = new Date(paymentTime.getTime() + Math.random() * 60 * 60 * 1000); // 提交时间稍后
      
      // 随机选择状态
      const weightedStatuses = [];
      statusDistribution.forEach(status => {
        for (let i = 0; i < status.weight; i++) {
          weightedStatuses.push(status);
        }
      });
      const selectedStatus = weightedStatuses[Math.floor(Math.random() * weightedStatuses.length)];
      
      // 7天免费订单特殊处理：跳过付款确认
      let finalStatus = selectedStatus.status;
      let configConfirmed = selectedStatus.config_confirmed;
      
      if (template.duration === '7days') {
        if (finalStatus === 'pending_payment' || finalStatus === 'confirmed_payment') {
          finalStatus = Math.random() > 0.5 ? 'pending_config' : 'confirmed_configuration';
          configConfirmed = finalStatus === 'confirmed_configuration';
        }
      }
      
      const orderData = {
        sales_code: salesCode,
        tradingview_username: `user_${timeKey}_${orderIndex}_${Date.now()}`,
        customer_wechat: `customer_wx_${orderIndex}`,
        duration: template.duration,
        amount: template.amount,
        payment_method: randomSales.data.payment_method || 'alipay',
        payment_time: paymentTime.toISOString(),
        purchase_type: Math.random() > 0.7 ? 'advance' : 'immediate',
        effective_time: paymentTime.toISOString(),
        status: finalStatus,
        config_confirmed: configConfirmed
      };
      
      const result = await makeRequest(
        '/orders?path=create', 
        orderData, 
        `${timeRange.label}订单${orderIndex} (${template.label})`
      );
      
      if (result.success) {
        allOrders.push({
          ...result.data,
          timeRange: timeKey,
          template: template.label,
          salesInfo: randomSales.data
        });
        
        log(`   ✅ ${timeRange.label}订单${orderIndex}: ${template.label} - ${finalStatus}`, 'success');
      }
    }
  }
  
  return allOrders;
};

// 4. 创建客户管理测试数据
const createCustomerTestData = async (orders) => {
  log(`\n=== 处理客户管理测试数据 ===`, 'important');
  
  // 统计客户数据
  const customerStats = {};
  orders.forEach(order => {
    const customerId = order.tradingview_username;
    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        tradingview_username: customerId,
        sales_wechat: order.salesInfo?.wechat_name || '未知',
        orders: [],
        latest_order: null
      };
    }
    
    customerStats[customerId].orders.push(order);
    
    // 找最新订单
    if (!customerStats[customerId].latest_order || 
        new Date(order.payment_time) > new Date(customerStats[customerId].latest_order.payment_time)) {
      customerStats[customerId].latest_order = order;
    }
  });
  
  log(`   📊 生成客户统计: ${Object.keys(customerStats).length}个客户`, 'info');
  return customerStats;
};

// 5. 创建佣金调整测试数据
const createCommissionTestData = async (salesList) => {
  log(`\n=== 创建佣金调整测试数据 ===`, 'important');
  
  const commissionTests = [];
  
  for (const sales of salesList) {
    if (!sales.success || !sales.data?.id) continue;
    
    // 为部分销售设置不同的佣金率
    const commissionRates = [25, 30, 32, 35, 38, 40];
    const randomRate = commissionRates[Math.floor(Math.random() * commissionRates.length)];
    
    commissionTests.push({
      salesId: sales.data.id,
      wechatName: sales.data.wechat_name,
      originalRate: sales.data.commission_rate || 30,
      testRate: randomRate
    });
    
    log(`   🔧 销售${sales.data.wechat_name}: 测试佣金率 ${randomRate}%`, 'info');
  }
  
  return commissionTests;
};

// 主执行函数
const createComprehensiveTestData = async () => {
  log('🚀 开始创建综合时间范围测试数据', 'important');
  const startTime = Date.now();
  
  try {
    // 生成时间范围
    const timeRanges = generateTimeRanges();
    log(`📅 时间范围配置:`, 'info');
    Object.entries(timeRanges).forEach(([key, range]) => {
      log(`   ${range.label}: ${range.orderCount}个订单`, 'info');
    });
    
    // 创建销售数据
    const primarySales = await createPrimarySales(3);
    const secondarySales = await createIndependentSecondarySales(3);
    const allSales = [...primarySales, ...secondarySales];
    
    // 创建订单数据
    const orders = await createTimeBasedOrders(allSales, timeRanges);
    
    // 创建客户管理数据
    const customerStats = await createCustomerTestData(orders);
    
    // 创建佣金测试数据
    const commissionTests = await createCommissionTestData(allSales);
    
    // 统计结果
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log(`\n🎉 测试数据创建完成！用时 ${duration.toFixed(2)} 秒`, 'success');
    log(`\n📊 数据统计:`, 'important');
    log(`   • 一级销售: ${primarySales.length}个`, 'info');
    log(`   • 独立二级销售: ${secondarySales.length}个`, 'info');
    log(`   • 总订单数: ${orders.length}个`, 'info');
    log(`   • 客户数量: ${Object.keys(customerStats).length}个`, 'info');
    log(`   • 佣金测试项: ${commissionTests.length}个`, 'info');
    
    // 按时间范围统计
    log(`\n📅 按时间范围分布:`, 'info');
    Object.entries(timeRanges).forEach(([key, range]) => {
      const rangeOrders = orders.filter(order => order.timeRange === key);
      log(`   • ${range.label}: ${rangeOrders.length}个订单`, 'info');
    });
    
    // 按状态统计
    log(`\n🔄 按订单状态分布:`, 'info');
    const statusStats = {};
    orders.forEach(order => {
      const status = order.status || 'unknown';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
    Object.entries(statusStats).forEach(([status, count]) => {
      log(`   • ${status}: ${count}个`, 'info');
    });
    
    // config_confirmed统计
    const confirmedOrders = orders.filter(order => order.config_confirmed === true);
    log(`\n✅ config_confirmed=true的订单: ${confirmedOrders.length}个 (${((confirmedOrders.length/orders.length)*100).toFixed(1)}%)`, 'success');
    
    log(`\n🎯 现在可以验证以下功能:`, 'important');
    log(`   1. 管理员数据概览 - 时间范围搜索`, 'info');
    log(`   2. 订单管理 - 付款确认/配置确认按钮`, 'info');
    log(`   3. 销售管理 - 佣金调整功能`, 'info');
    log(`   4. 客户管理 - config_confirmed过滤`, 'info');
    log(`   5. 7天免费订单 - 无付款确认流程`, 'info');
    
    return {
      success: true,
      primarySales: primarySales.length,
      secondarySales: secondarySales.length,
      orders: orders.length,
      customers: Object.keys(customerStats).length,
      commissionTests: commissionTests.length,
      duration
    };
    
  } catch (error) {
    log(`❌ 创建测试数据失败: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
};

// 执行脚本
if (require.main === module) {
  createComprehensiveTestData()
    .then(result => {
      if (result.success) {
        console.log(`\n${colors.green}✅ 综合测试数据创建成功！${colors.reset}`);
        process.exit(0);
      } else {
        console.log(`\n${colors.red}❌ 测试数据创建失败${colors.reset}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`\n${colors.red}❌ 脚本执行错误: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = { createComprehensiveTestData };