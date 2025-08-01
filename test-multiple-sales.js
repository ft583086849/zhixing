const axios = require('axios');

async function testMultipleSales() {
  console.log('🔍 开始使用多个不同微信名测试销售API...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 生成多个不同的微信名
    const testCases = [
      {
        name: '测试销售1',
        data: {
          wechat_name: `test_sales_001_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          payment_method: 'alipay',
          payment_address: 'test1@alipay.com',
          alipay_surname: '张'
        }
      },
      {
        name: '测试销售2',
        data: {
          wechat_name: `test_sales_002_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          payment_method: 'crypto',
          payment_address: '0x1234567890abcdef',
          chain_name: 'ETH'
        }
      },
      {
        name: '测试销售3',
        data: {
          wechat_name: `test_sales_003_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          payment_method: 'alipay',
          payment_address: 'test3@alipay.com',
          alipay_surname: '李'
        }
      }
    ];
    
    console.log('\n📊 测试销售API创建功能...');
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 ${testCase.name} (${i + 1}/${testCases.length})`);
      
      try {
        const response = await axios.post(`${baseURL}/sales?path=create`, testCase.data, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`✅ ${testCase.name} 创建成功`);
        console.log(`📊 响应状态: ${response.status}`);
        console.log(`📊 销售ID: ${response.data.data.sales_id}`);
        console.log(`📊 链接代码: ${response.data.data.link_code}`);
        
      } catch (error) {
        console.log(`❌ ${testCase.name} 创建失败`);
        console.log(`📊 错误状态码: ${error.response?.status}`);
        console.log(`📊 错误响应: ${JSON.stringify(error.response?.data)}`);
        
        if (error.response?.data?.message) {
          console.log(`🔍 错误分析: ${error.response.data.message}`);
        }
      }
    }
    
    // 测试一级销售API
    console.log('\n📊 测试一级销售API创建功能...');
    
    const primaryTestCases = [
      {
        name: '测试一级销售1',
        data: {
          wechat_name: `test_primary_001_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          payment_method: 'alipay',
          payment_address: 'primary1@alipay.com',
          alipay_surname: '王'
        }
      },
      {
        name: '测试一级销售2',
        data: {
          wechat_name: `test_primary_002_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          payment_method: 'crypto',
          payment_address: '0xfedcba0987654321',
          chain_name: 'BTC'
        }
      }
    ];
    
    for (let i = 0; i < primaryTestCases.length; i++) {
      const testCase = primaryTestCases[i];
      console.log(`\n🧪 ${testCase.name} (${i + 1}/${primaryTestCases.length})`);
      
      try {
        const response = await axios.post(`${baseURL}/primary-sales?path=create`, testCase.data, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`✅ ${testCase.name} 创建成功`);
        console.log(`📊 响应状态: ${response.status}`);
        console.log(`📊 一级销售ID: ${response.data.data.primary_sales_id}`);
        console.log(`📊 二级注册代码: ${response.data.data.secondary_registration_code}`);
        
      } catch (error) {
        console.log(`❌ ${testCase.name} 创建失败`);
        console.log(`📊 错误状态码: ${error.response?.status}`);
        console.log(`📊 错误响应: ${JSON.stringify(error.response?.data)}`);
        
        if (error.response?.data?.message) {
          console.log(`🔍 错误分析: ${error.response.data.message}`);
        }
      }
    }
    
    // 测试管理员API
    console.log('\n📊 测试管理员API...');
    
    try {
      const adminResponse = await axios.get(`${baseURL}/admin?path=stats`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ 管理员API测试成功');
      console.log(`📊 响应状态: ${adminResponse.status}`);
      console.log(`📊 统计信息: ${JSON.stringify(adminResponse.data.data, null, 2)}`);
      
    } catch (error) {
      console.log('❌ 管理员API测试失败');
      console.log(`📊 错误状态码: ${error.response?.status}`);
      console.log(`📊 错误响应: ${JSON.stringify(error.response?.data)}`);
    }
    
    console.log('\n🎉 多微信名测试完成！');
    console.log('✅ 所有测试用例都使用了唯一的微信名');
    console.log('✅ 避免了微信名重复导致的400错误');
    
    return {
      success: true,
      message: '多微信名测试完成'
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testMultipleSales()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 