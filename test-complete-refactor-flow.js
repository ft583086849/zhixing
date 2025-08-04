// 完整重构流程测试脚本
const https = require('https');

console.log('🚀 开始测试完整重构流程...\n');

// 测试步骤计数器
let stepCounter = 1;
let testResults = {
  success: 0,
  failed: 0,
  details: []
};

// HTTP请求封装函数
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 记录测试结果
function logResult(step, description, success, details) {
  const status = success ? '✅' : '❌';
  console.log(`${status} 步骤${step}: ${description}`);
  if (details) {
    console.log(`   详情: ${details}`);
  }
  console.log('');
  
  testResults.details.push({
    step, description, success, details
  });
  
  if (success) {
    testResults.success++;
  } else {
    testResults.failed++;
  }
}

// 生成唯一标识符
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function testCompleteRefactorFlow() {
  let primarySalesData = null;
  let secondarySalesData = null;
  
  try {
    
    // =====================================
    // 步骤1：测试一级销售创建
    // =====================================
    console.log(`📋 步骤${stepCounter++}: 测试一级销售创建`);
    
    const primarySalesPayload = {
      wechat_name: `test_primary_${generateUniqueId()}`,
      payment_method: 'alipay',
      payment_address: 'test@example.com',
      alipay_surname: '测试'
    };
    
    try {
      const primaryResponse = await makeRequest({
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/primary-sales?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js Test Client'
        }
      }, JSON.stringify(primarySalesPayload));
      
      if (primaryResponse.statusCode === 201 && primaryResponse.data.success) {
        primarySalesData = primaryResponse.data.data;
        logResult(1, '一级销售创建成功', true, 
          `生成了sales_code: ${primarySalesData.sales_code}`);
      } else {
        logResult(1, '一级销售创建失败', false, 
          `状态码: ${primaryResponse.statusCode}, 响应: ${JSON.stringify(primaryResponse.data)}`);
        return;
      }
    } catch (error) {
      logResult(1, '一级销售创建请求失败', false, error.message);
      return;
    }
    
    // =====================================
    // 步骤2：测试二级销售注册代码验证
    // =====================================
    console.log(`📋 步骤${stepCounter++}: 测试二级销售注册代码验证`);
    
    try {
      const validateResponse = await makeRequest({
        hostname: 'zhixing-seven.vercel.app',
        path: `/api/secondary-sales?path=validate&link_code=${primarySalesData.secondary_registration_code}&link_type=secondary_registration`,
        method: 'GET',
        headers: {
          'User-Agent': 'Node.js Test Client'
        }
      });
      
      if (validateResponse.statusCode === 200 && validateResponse.data.success) {
        logResult(2, '二级销售注册代码验证成功', true,
          `验证了注册代码: ${primarySalesData.secondary_registration_code}`);
      } else {
        logResult(2, '二级销售注册代码验证失败', false,
          `状态码: ${validateResponse.statusCode}, 响应: ${JSON.stringify(validateResponse.data)}`);
      }
    } catch (error) {
      logResult(2, '二级销售注册代码验证请求失败', false, error.message);
    }
    
    // =====================================
    // 步骤3：测试二级销售注册
    // =====================================
    console.log(`📋 步骤${stepCounter++}: 测试二级销售注册`);
    
    const secondarySalesPayload = {
      wechat_name: `test_secondary_${generateUniqueId()}`,
      payment_method: 'alipay',
      payment_address: 'secondary@example.com',
      alipay_surname: '二级测试',
      registration_code: primarySalesData.secondary_registration_code,
      primary_sales_id: primarySalesData.primary_sales_id
    };
    
    try {
      const secondaryResponse = await makeRequest({
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/secondary-sales?path=register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js Test Client'
        }
      }, JSON.stringify(secondarySalesPayload));
      
      if (secondaryResponse.statusCode === 201 && secondaryResponse.data.success) {
        secondarySalesData = secondaryResponse.data.data;
        logResult(3, '二级销售注册成功', true,
          `生成了sales_code: ${secondarySalesData.sales_code}`);
      } else {
        logResult(3, '二级销售注册失败', false,
          `状态码: ${secondaryResponse.statusCode}, 响应: ${JSON.stringify(secondaryResponse.data)}`);
      }
    } catch (error) {
      logResult(3, '二级销售注册请求失败', false, error.message);
    }
    
    // =====================================
    // 步骤4：测试一级销售用户购买流程
    // =====================================
    console.log(`📋 步骤${stepCounter++}: 测试一级销售用户购买流程`);
    
    const primaryOrderPayload = {
      sales_code: primarySalesData.sales_code,
      tradingview_username: `test_user_primary_${generateUniqueId()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      alipay_amount: 188
    };
    
    try {
      const primaryOrderResponse = await makeRequest({
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js Test Client'
        }
      }, JSON.stringify(primaryOrderPayload));
      
      if (primaryOrderResponse.statusCode === 200 && primaryOrderResponse.data.success) {
        logResult(4, '一级销售用户购买成功', true,
          `订单ID: ${primaryOrderResponse.data.data.order_id}`);
      } else {
        logResult(4, '一级销售用户购买失败', false,
          `状态码: ${primaryOrderResponse.statusCode}, 响应: ${JSON.stringify(primaryOrderResponse.data)}`);
      }
    } catch (error) {
      logResult(4, '一级销售用户购买请求失败', false, error.message);
    }
    
    // =====================================
    // 步骤5：测试二级销售用户购买流程
    // =====================================
    if (secondarySalesData) {
      console.log(`📋 步骤${stepCounter++}: 测试二级销售用户购买流程`);
      
      const secondaryOrderPayload = {
        sales_code: secondarySalesData.sales_code,
        tradingview_username: `test_user_secondary_${generateUniqueId()}`,
        duration: '1month', 
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        alipay_amount: 188
      };
      
      try {
        const secondaryOrderResponse = await makeRequest({
          hostname: 'zhixing-seven.vercel.app',
          path: '/api/orders?path=create',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Node.js Test Client'
          }
        }, JSON.stringify(secondaryOrderPayload));
        
        if (secondaryOrderResponse.statusCode === 200 && secondaryOrderResponse.data.success) {
          logResult(5, '二级销售用户购买成功', true,
            `订单ID: ${secondaryOrderResponse.data.data.order_id}`);
        } else {
          logResult(5, '二级销售用户购买失败', false,
            `状态码: ${secondaryOrderResponse.statusCode}, 响应: ${JSON.stringify(secondaryOrderResponse.data)}`);
        }
      } catch (error) {
        logResult(5, '二级销售用户购买请求失败', false, error.message);
      }
    }
    
  } catch (error) {
    console.error('测试流程发生未预期错误:', error);
  }
  
  // =====================================
  // 测试结果汇总
  // =====================================
  console.log('='.repeat(60));
  console.log('📊 完整重构流程测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${testResults.success}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${Math.round(testResults.success / (testResults.success + testResults.failed) * 100)}%`);
  console.log('');
  
  if (testResults.success === testResults.success + testResults.failed) {
    console.log('🎉 重构完全成功！');
    console.log('🔗 sales_code标准已完全实现');
    console.log('📝 所有功能正常工作');
  } else {
    console.log('⚠️ 部分功能需要进一步修复');
    console.log('📋 请检查失败的步骤详情');
  }
  
  console.log('\n测试详情:');
  testResults.details.forEach(result => {
    console.log(`  ${result.success ? '✅' : '❌'} ${result.description}`);
    if (result.details) {
      console.log(`     ${result.details}`);
    }
  });
}

// 执行测试
testCompleteRefactorFlow()
  .then(() => {
    console.log('\n✅ 测试完成');
  })
  .catch((error) => {
    console.log('\n❌ 测试失败:', error.message);
  });