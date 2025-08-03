#!/usr/bin/env node

/**
 * 调试链接表数据
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

async function debugLinks() {
  console.log('🔍 调试链接表数据');
  
  try {
    // 创建一个新的分销商来测试
    console.log('\n1. 创建新的分销商...');
    const createOptions = {
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const createData = {
      wechat_name: `debug_test_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'debug@example.com',
      alipay_surname: '调试'
    };

    const createResult = await makeRequest(createOptions, createData);
    
    if (createResult.json && createResult.json.success) {
      const salesData = createResult.json.data;
      console.log('✅ 分销商创建成功:');
      console.log(`   ID: ${salesData.primary_sales_id}`);
      console.log(`   微信号: ${salesData.wechat_name}`);
      console.log(`   用户销售代码: ${salesData.user_sales_code}`);
      
      // 立即测试订单创建
      console.log('\n2. 测试订单创建...');
      const orderOptions = {
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const orderData = {
        link_code: salesData.user_sales_code,
        wechat_name: 'debug_buyer',
        real_name: '调试买家',
        tradingview_username: `debug_tv_${Date.now()}`,
        phone: '13800000001',
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString()
      };

      const orderResult = await makeRequest(orderOptions, orderData);
      
      if (orderResult.json && orderResult.json.success) {
        console.log('✅ 订单创建成功!');
        console.log(`   订单ID: ${orderResult.json.data.order_id || orderResult.json.data.id}`);
        console.log(`   买家: ${orderData.real_name}`);
        console.log(`   金额: ${orderData.amount}元`);
        return true;
      } else {
        console.log('❌ 订单创建失败:');
        console.log('   错误:', orderResult.json?.message || 'Unknown error');
        console.log('   响应:', orderResult.json || orderResult.text);
        return false;
      }
    } else {
      console.log('❌ 分销商创建失败:');
      console.log('   错误:', createResult.json?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
    return false;
  }
}

if (require.main === module) {
  debugLinks()
    .then(success => {
      if (success) {
        console.log('\n🎉 调试完成：分销商和订单创建都成功！');
      } else {
        console.log('\n❌ 调试发现问题，需要进一步修复');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('调试脚本出错:', error);
      process.exit(1);
    });
}