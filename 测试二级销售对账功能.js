#!/usr/bin/env node

const https = require('https');

// 测试二级销售对账功能
async function testSecondarySalesSettlement() {
  console.log('🧪 开始测试二级销售对账功能...\n');

  // 测试参数
  const testCases = [
    {
      name: '按微信号查询',
      params: { wechat_name: '二级销售' }
    },
    {
      name: '按销售代码查询',  
      params: { sales_code: 'SS' }
    },
    {
      name: '按时间范围查询',
      params: { payment_date_range: '2025-01-01,2025-01-31' }
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📋 测试: ${testCase.name}`);
    
    try {
      // 构建查询字符串
      const queryString = Object.entries(testCase.params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const response = await makeRequest(`/api/secondary-sales?path=settlement&${queryString}`);
      
      if (response.success) {
        console.log(`  ✅ ${testCase.name} - 成功`);
        console.log(`     返回数据结构: ${Object.keys(response.data).join(', ')}`);
        
        if (response.data.sales) {
          console.log(`     销售类型: ${response.data.sales.sales_type || '未知'}`);
          console.log(`     佣金比率: ${response.data.sales.commission_rate || 0}`);
          console.log(`     订单总数: ${response.data.sales.total_orders || 0}`);
        }
        
        passedTests++;
      } else {
        console.log(`  ❌ ${testCase.name} - 失败: ${response.message}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name} - 错误: ${error.message}`);
    }
    
    console.log(''); // 空行
  }

  // 测试总结
  console.log('📊 测试总结:');
  console.log(`   通过: ${passedTests}/${totalTests}`);
  console.log(`   成功率: ${Math.round(passedTests / totalTests * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！二级销售对账功能正常');
  } else {
    console.log('⚠️  部分测试失败，需要检查实现');
  }
}

// 发送HTTP请求的辅助函数
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

// 运行测试
if (require.main === module) {
  testSecondarySalesSettlement().catch(console.error);
}

module.exports = { testSecondarySalesSettlement };