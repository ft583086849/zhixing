#!/usr/bin/env node

/**
 * 检查数据库订单数据 - 直接查询数据库确认是否有订单
 */

const https = require('https');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function checkDatabaseOrders() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  console.log('🔍 检查数据库订单数据...\n');
  
  try {
    // 创建一个测试订单来验证API是否工作
    console.log('📝 1. 尝试创建测试订单...');
    const testOrderData = {
      sales_code: 'DB_CHECK_' + Date.now(),
      sales_type: 'primary',
      tradingview_username: 'db_check_user',
      customer_wechat: 'db_check_wechat',
      duration: '1month',
      purchase_type: 'immediate',
      effective_time: new Date().toISOString(),
      amount: 188,
      payment_method: 'alipay',
      alipay_amount: 188,
      crypto_amount: 0,
      commission_rate: 0.30,
      commission_amount: 56.4,
      status: 'pending_payment',
      payment_time: new Date().toISOString(),
      screenshot_path: 'test_screenshot.jpg'
    };
    
    const createOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const createResult = await makeRequest(createOptions, JSON.stringify(testOrderData));
    console.log(`   创建订单状态码: ${createResult.status}`);
    console.log('   响应:', JSON.stringify(createResult.data, null, 2));
    
    let hasOrders = false;
    let orderCreated = false;
    
    if (createResult.status === 201 || createResult.status === 200) {
      console.log('   ✅ 测试订单创建成功！这说明数据库连接正常');
      hasOrders = true;
      orderCreated = true;
    } else if (createResult.status === 404) {
      console.log('   ❌ API路由问题：订单创建API不存在或路由配置错误');
    } else if (createResult.status === 500) {
      console.log('   ❌ 服务器错误：可能是数据库连接问题');
    } else {
      console.log('   ⚠️  其他响应，需要进一步分析');
    }
    
    // 2. 尝试通过购买页面检查销售数据
    console.log('\n👥 2. 检查销售数据是否存在...');
    const salesCheckOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/sales?action=check',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const salesResult = await makeRequest(salesCheckOptions);
    console.log(`   销售检查状态码: ${salesResult.status}`);
    
    if (salesResult.status === 404) {
      console.log('   ⚠️  销售API路由可能有问题');
    } else {
      console.log('   销售API响应:', JSON.stringify(salesResult.data, null, 2));
    }
    
    // 3. 检查数据库表是否存在的API
    console.log('\n🗃️  3. 尝试检查数据库结构...');
    const dbCheckOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=db-check',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const dbResult = await makeRequest(dbCheckOptions);
    console.log(`   数据库检查状态码: ${dbResult.status}`);
    console.log('   响应:', JSON.stringify(dbResult.data, null, 2));
    
    // 4. 分析结果
    console.log('\n📊 分析结果:');
    
    if (!hasOrders && createResult.status === 404) {
      console.log('❌ 核心问题：API路由配置有问题');
      console.log('   - 订单创建API返回404，说明/api/orders路由不存在');
      console.log('   - 这可能是Vercel部署配置问题');
      console.log('   - 管理员系统无法获取数据是因为API本身有问题');
      
      console.log('\n🔧 建议的修复方案:');
      console.log('   1. 检查vercel.json配置文件中的API路由设置');
      console.log('   2. 确认api/目录下的文件结构');
      console.log('   3. 检查Vercel部署日志是否有错误');
      
    } else if (!hasOrders && createResult.status === 500) {
      console.log('❌ 核心问题：数据库连接或配置问题');
      console.log('   - API路由存在但服务器内部错误');
      console.log('   - 可能是数据库连接字符串、表结构或权限问题');
      
      console.log('\n🔧 建议的修复方案:');
      console.log('   1. 检查Vercel环境变量中的数据库配置');
      console.log('   2. 确认数据库表是否已创建');
      console.log('   3. 检查数据库用户权限');
      
    } else if (hasOrders && orderCreated) {
      console.log('✅ 数据库连接正常，API工作正常');
      console.log('   - 刚刚成功创建了一个测试订单');
      console.log('   - 管理员系统显示0可能是其他原因');
      
      console.log('\n🔧 需要进一步检查:');
      console.log('   1. 管理员登录是否有权限问题');
      console.log('   2. 数据概览API的时间过滤是否还有问题');
      console.log('   3. 前端获取数据的逻辑是否正确');
      
    } else {
      console.log('⚠️  情况复杂，需要更详细的诊断');
    }
    
    console.log('\n💡 立即可以验证的:');
    console.log('   1. 刷新管理员后台，看数据概览是否有变化');
    console.log('   2. 检查订单管理页面是否显示新创建的测试订单');
    console.log('   3. 查看浏览器开发者工具的Network面板，看API请求是否成功');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.log('\n这通常表示:');
    console.log('   - 网络连接问题');
    console.log('   - Vercel部署还没完成');
    console.log('   - 服务器完全无响应');
  }
}

if (require.main === module) {
  checkDatabaseOrders();
}

module.exports = { checkDatabaseOrders };