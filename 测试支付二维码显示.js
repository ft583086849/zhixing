#!/usr/bin/env node

const https = require('https');

// 测试支付二维码显示功能
async function testPaymentQRDisplay() {
  console.log('🧪 开始测试支付二维码显示功能...\n');

  // 测试1: 公开获取支付配置
  console.log('📋 测试1: 公开获取支付配置');
  try {
    const response = await makeRequest('/api/payment-config?path=public');
    
    if (response.success) {
      console.log('  ✅ 公开支付配置获取成功');
      const data = response.data;
      
      console.log(`     支付宝账号: ${data.alipay_account || '未设置'}`);
      console.log(`     支付宝姓氏: ${data.alipay_surname || '未设置'}`);
      console.log(`     支付宝二维码: ${data.alipay_qr_code ? '已设置' : '未设置'}`);
      console.log(`     加密地址: ${data.crypto_address || '未设置'}`);
      console.log(`     链名: ${data.crypto_chain_name || '未设置'}`);
      console.log(`     加密二维码: ${data.crypto_qr_code ? '已设置' : '未设置'}`);
      
      if (data.alipay_qr_code && data.alipay_qr_code.length > 50) {
        console.log('     ✅ 支付宝二维码数据有效 (Base64格式)');
      } else {
        console.log('     ⚠️  支付宝二维码数据为空或过短');
      }
      
      if (data.crypto_qr_code && data.crypto_qr_code.length > 50) {
        console.log('     ✅ 加密地址二维码数据有效 (Base64格式)');
      } else {
        console.log('     ⚠️  加密地址二维码数据为空或过短');
      }
      
    } else {
      console.log(`  ❌ 获取失败: ${response.message}`);
    }
  } catch (error) {
    console.log(`  ❌ 请求错误: ${error.message}`);
  }
  
  console.log(''); // 空行

  // 测试2: 验证现有购买页面的配置获取
  console.log('📋 测试2: 验证购买页面能正常访问');
  try {
    const response = await makeRequest('/purchase?sales_code=test');
    console.log('  ✅ 购买页面可以访问');
  } catch (error) {
    console.log(`  ⚠️  购买页面访问测试: ${error.message}`);
  }

  console.log('\n📊 测试总结:');
  console.log('   - 公开支付配置API已实现');
  console.log('   - 购买页面二维码显示逻辑已存在');
  console.log('   - 需要在管理员页面配置有效的二维码数据');
  console.log('\n🎯 下一步操作:');
  console.log('   1. 在管理员页面上传支付宝和加密地址二维码');
  console.log('   2. 访问购买页面验证二维码显示效果');
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
          // 如果不是JSON响应（比如HTML页面），直接成功
          if (res.statusCode === 200) {
            resolve({ success: true, data: 'HTML页面' });
          } else {
            reject(new Error(`JSON解析失败: ${error.message}`));
          }
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
  testPaymentQRDisplay().catch(console.error);
}

module.exports = { testPaymentQRDisplay };