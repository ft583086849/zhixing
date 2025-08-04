// 测试一级销售创建功能
const https = require('https');

function testPrimarySalesCreation() {
  return new Promise((resolve, reject) => {
    console.log('🧪 测试一级销售创建API...\n');
    
    const postData = JSON.stringify({
      wechat_name: `test_primary_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'test@example.com',
      alipay_surname: '测试'
    });
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Node.js Test Client'
      }
    };
    
    console.log('📤 发送请求到:', `https://${options.hostname}${options.path}`);
    console.log('📋 请求数据:', postData);
    console.log('');
    
    const req = https.request(options, (res) => {
      console.log(`📊 响应状态码: ${res.statusCode}`);
      console.log(`📦 响应头:`, res.headers);
      console.log('');
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log('📥 响应数据:');
          console.log(JSON.stringify(parsedResponse, null, 2));
          console.log('');
          
          // 验证链接格式
          if (parsedResponse.success && parsedResponse.data) {
            const data = parsedResponse.data;
            
            console.log('🔍 验证链接格式:');
            
            // 检查二级销售注册链接
            if (data.secondary_registration_link) {
              console.log('🔗 二级销售注册链接:', data.secondary_registration_link);
              
              if (data.secondary_registration_link.includes('/secondary-sales?sales_code=')) {
                console.log('✅ 二级销售注册链接格式正确');
              } else {
                console.log('❌ 二级销售注册链接格式错误');
              }
            }
            
            // 检查用户购买链接
            if (data.user_sales_link) {
              console.log('🔗 用户购买链接:', data.user_sales_link);
              
              if (data.user_sales_link.includes('/purchase?sales_code=')) {
                console.log('✅ 用户购买链接格式正确');
              } else {
                console.log('❌ 用户购买链接格式错误');
              }
            }
            
            console.log('');
            console.log('🎯 修复验证结果:');
            const hasCorrectSecondaryLink = data.secondary_registration_link && data.secondary_registration_link.includes('/secondary-sales?sales_code=');
            const hasCorrectUserLink = data.user_sales_link && data.user_sales_link.includes('/purchase?sales_code=');
            
            if (hasCorrectSecondaryLink && hasCorrectUserLink) {
              console.log('🎉 链接修复完全成功！');
              console.log('✅ 二级销售注册链接正确指向 /secondary-sales?sales_code=xxx');
              console.log('✅ 用户购买链接正确指向 /purchase?sales_code=xxx');
              console.log('✅ 不再错误指向管理员系统');
            } else {
              console.log('❌ 链接修复未完全成功');
            }
            
            resolve(parsedResponse);
            
          } else {
            console.log('❌ API响应异常:', parsedResponse);
            resolve(parsedResponse);
          }
        } catch (error) {
          console.log('❌ 响应解析错误:', error.message);
          console.log('原始响应:', responseData);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ 请求错误:', error.message);
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      console.log('❌ 请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// 执行测试
testPrimarySalesCreation()
  .then(() => {
    console.log('\n✅ 测试完成');
  })
  .catch((error) => {
    console.log('\n❌ 测试失败:', error.message);
  });