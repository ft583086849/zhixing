#!/usr/bin/env node

/**
 * 测试高阶销售注册页面的API调用和响应
 */

const https = require('https');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            json: null
          };
          
          if (body.trim()) {
            try {
              result.json = JSON.parse(body);
            } catch (e) {
              result.text = body;
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testPrimarySalesCreation() {
  console.log('🧪 测试高阶销售注册API和链接生成');
  console.log('=' .repeat(60));

  try {
    // 1. 测试API创建
    console.log('\n📋 1. 测试创建新的一级销售');
    const createOptions = {
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const salesData = {
      wechat_name: `test_frontend_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'frontend_test@example.com',
      alipay_surname: '前端测试'
    };

    console.log(`🔗 创建销售商: ${salesData.wechat_name}`);
    
    const result = await makeRequest(createOptions, salesData);
    
    if (result.json && result.json.success) {
      const data = result.json.data;
      console.log('✅ API创建成功');
      console.log(`   一级销售ID: ${data.primary_sales_id}`);
      console.log(`   微信号: ${data.wechat_name}`);
      console.log('');
      console.log('🔗 生成的链接:');
      console.log(`   用户购买链接: ${data.user_sales_link}`);
      console.log(`   用户购买代码: ${data.user_sales_code}`);
      console.log(`   二级注册链接: ${data.secondary_registration_link}`);
      console.log(`   二级注册代码: ${data.secondary_registration_code}`);
      
      // 2. 测试生成的链接访问
      console.log('\n📋 2. 测试生成的用户购买链接');
      const purchaseOptions = {
        hostname: 'zhixing-seven.vercel.app',
        path: `/api/sales?linkCode=${data.user_sales_code}`,
        method: 'GET'
      };
      
      const purchaseResult = await makeRequest(purchaseOptions);
      if (purchaseResult.json && purchaseResult.json.success) {
        console.log('✅ 用户购买链接验证成功');
        console.log(`   销售商: ${purchaseResult.json.data.wechat_name}`);
      } else {
        console.log('❌ 用户购买链接验证失败');
        console.log('   响应:', purchaseResult.json || purchaseResult.text);
      }
      
      // 3. 测试二级注册链接
      console.log('\n📋 3. 测试二级销售注册链接');
      const regOptions = {
        hostname: 'zhixing-seven.vercel.app',
        path: `/api/links?code=${data.secondary_registration_code}`,
        method: 'GET'
      };
      
      const regResult = await makeRequest(regOptions);
      if (regResult.json && regResult.json.success) {
        console.log('✅ 二级注册链接验证成功');
      } else {
        console.log('⚠️ 二级注册链接验证需要专门的API端点');
      }
      
      return data;
    } else {
      console.log('❌ API创建失败');
      console.log('   错误:', result.json?.message || 'Unknown error');
      console.log('   响应:', result.json || result.text);
      return null;
    }
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
    return null;
  }
}

if (require.main === module) {
  testPrimarySalesCreation()
    .then(result => {
      if (result) {
        console.log('\n🎉 高阶销售注册功能测试完成!');
        console.log('💡 前端页面应该能够正确显示这些链接了');
      } else {
        console.log('\n❌ 测试失败，需要进一步调试');
      }
    })
    .catch(error => {
      console.error('测试脚本出错:', error);
      process.exit(1);
    });
}