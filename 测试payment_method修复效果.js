// 测试 payment_method 修复效果
const https = require('https');

async function testPaymentMethodFix() {
  console.log('🧪 测试 payment_method 修复效果...\n');
  
  const baseUrl = 'https://zhixing-seven.vercel.app';
  
  try {
    // 1. 先触发数据库结构修复
    console.log('1️⃣ 触发数据库结构修复...');
    
    const healthResult = await makeRequest(`${baseUrl}/api/admin?path=health`, 'GET');
    console.log(`   数据库健康检查: ${healthResult.success ? '✅成功' : '❌失败'}`);
    if (healthResult.success) {
      console.log(`   数据库状态: ${healthResult.data?.database_status || '未知'}`);
    }
    
    // 等待一下确保修复完成
    console.log('   等待数据库修复完成...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. 测试一级销售创建 - alipay
    console.log('\n2️⃣ 测试一级销售创建 (alipay)...');
    
    const primaryAlipayData = {
      wechat_name: 'test_primary_alipay_' + Date.now(),
      payment_method: 'alipay',
      payment_address: '13800138000',
      alipay_surname: '张'
    };
    
    const primaryAlipayResult = await makeRequest(
      `${baseUrl}/api/primary-sales?path=create`, 
      'POST', 
      JSON.stringify(primaryAlipayData)
    );
    
    console.log(`   一级销售创建(alipay): ${primaryAlipayResult.success ? '✅成功' : '❌失败'}`);
    if (!primaryAlipayResult.success) {
      console.log(`   错误信息: ${primaryAlipayResult.message}`);
      if (primaryAlipayResult.debug) {
        console.log(`   详细错误: ${primaryAlipayResult.debug.message}`);
      }
    } else {
      console.log(`   销售ID: ${primaryAlipayResult.data?.primary_sales_id}`);
      console.log(`   销售代码: ${primaryAlipayResult.data?.sales_code}`);
    }
    
    // 3. 测试一级销售创建 - crypto
    console.log('\n3️⃣ 测试一级销售创建 (crypto)...');
    
    const primaryCryptoData = {
      wechat_name: 'test_primary_crypto_' + Date.now(),
      payment_method: 'crypto',
      payment_address: '0x1234567890abcdef1234567890abcdef12345678',
      chain_name: 'ETH'
    };
    
    const primaryCryptoResult = await makeRequest(
      `${baseUrl}/api/primary-sales?path=create`, 
      'POST', 
      JSON.stringify(primaryCryptoData)
    );
    
    console.log(`   一级销售创建(crypto): ${primaryCryptoResult.success ? '✅成功' : '❌失败'}`);
    if (!primaryCryptoResult.success) {
      console.log(`   错误信息: ${primaryCryptoResult.message}`);
      if (primaryCryptoResult.debug) {
        console.log(`   详细错误: ${primaryCryptoResult.debug.message}`);
      }
    } else {
      console.log(`   销售ID: ${primaryCryptoResult.data?.primary_sales_id}`);
      console.log(`   销售代码: ${primaryCryptoResult.data?.sales_code}`);
    }
    
    // 4. 测试二级销售独立注册 - alipay
    console.log('\n4️⃣ 测试二级销售独立注册 (alipay)...');
    
    const secondaryAlipayData = {
      wechat_name: 'test_secondary_alipay_' + Date.now(),
      payment_method: 'alipay',
      payment_address: '13900139000',
      alipay_surname: '李'
    };
    
    const secondaryAlipayResult = await makeRequest(
      `${baseUrl}/api/secondary-sales?path=register-independent`, 
      'POST', 
      JSON.stringify(secondaryAlipayData)
    );
    
    console.log(`   二级销售注册(alipay): ${secondaryAlipayResult.success ? '✅成功' : '❌失败'}`);
    if (!secondaryAlipayResult.success) {
      console.log(`   错误信息: ${secondaryAlipayResult.message}`);
    } else {
      console.log(`   销售ID: ${secondaryAlipayResult.data?.secondary_sales_id}`);
      console.log(`   销售代码: ${secondaryAlipayResult.data?.sales_code}`);
    }
    
    // 5. 测试二级销售独立注册 - crypto
    console.log('\n5️⃣ 测试二级销售独立注册 (crypto)...');
    
    const secondaryCryptoData = {
      wechat_name: 'test_secondary_crypto_' + Date.now(),
      payment_method: 'crypto',
      payment_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      chain_name: 'BTC'
    };
    
    const secondaryCryptoResult = await makeRequest(
      `${baseUrl}/api/secondary-sales?path=register-independent`, 
      'POST', 
      JSON.stringify(secondaryCryptoData)
    );
    
    console.log(`   二级销售注册(crypto): ${secondaryCryptoResult.success ? '✅成功' : '❌失败'}`);
    if (!secondaryCryptoResult.success) {
      console.log(`   错误信息: ${secondaryCryptoResult.message}`);
    } else {
      console.log(`   销售ID: ${secondaryCryptoResult.data?.secondary_sales_id}`);
      console.log(`   销售代码: ${secondaryCryptoResult.data?.sales_code}`);
    }
    
    // 6. 测试旧的无效值 - 确保被正确拒绝
    console.log('\n6️⃣ 测试无效payment_method值...');
    
    const invalidData = {
      wechat_name: 'test_invalid_' + Date.now(),
      payment_method: 'wechat', // 这个值现在应该被拒绝
      payment_address: 'test'
    };
    
    const invalidResult = await makeRequest(
      `${baseUrl}/api/primary-sales?path=create`, 
      'POST', 
      JSON.stringify(invalidData)
    );
    
    console.log(`   无效值测试: ${!invalidResult.success ? '✅正确拒绝' : '❌错误接受'}`);
    if (!invalidResult.success) {
      console.log(`   拒绝信息: ${invalidResult.message}`);
    }
    
    // 7. 总结测试结果
    console.log('\n📊 测试结果总结:');
    
    const allTests = [
      { name: '一级销售创建(alipay)', result: primaryAlipayResult.success },
      { name: '一级销售创建(crypto)', result: primaryCryptoResult.success },
      { name: '二级销售注册(alipay)', result: secondaryAlipayResult.success },
      { name: '二级销售注册(crypto)', result: secondaryCryptoResult.success },
      { name: '无效值正确拒绝', result: !invalidResult.success }
    ];
    
    const passedTests = allTests.filter(test => test.result).length;
    const totalTests = allTests.length;
    
    allTests.forEach(test => {
      console.log(`   ${test.result ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\n🎯 测试通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！payment_method修复成功！');
      console.log('   现在用户可以正常注册一级销售和二级销售了');
      console.log('   支持的收款方式：');
      console.log('   - alipay: 支付宝收款');
      console.log('   - crypto: 线上地址码收款');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// HTTP请求函数
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ 
            success: false, 
            message: '解析响应失败',
            raw: responseData.substring(0, 200)
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, message: '网络请求失败' });
    });

    if (data && method !== 'GET') {
      req.write(data);
    }
    req.end();
  });
}

// 执行测试
testPaymentMethodFix();