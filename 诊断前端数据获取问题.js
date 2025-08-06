#!/usr/bin/env node

/**
 * 诊断前端数据获取问题 - 检查管理员API调用
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

async function diagnoseFrontendDataIssue() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  console.log('🔍 诊断前端数据获取问题...\n');
  
  try {
    // 1. 首先确认订单确实创建了
    console.log('📋 1. 确认订单是否真的创建了...');
    
    // 尝试不同的时间范围参数
    const timeRanges = ['all', 'today', 'week', 'month'];
    
    for (const timeRange of timeRanges) {
      console.log(`\n🕐 测试时间范围: ${timeRange}`);
      
      const statsOptions = {
        hostname: baseUrl,
        port: 443,
        path: `/api/admin?path=stats&timeRange=${timeRange}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const statsResult = await makeRequest(statsOptions);
      console.log(`   状态码: ${statsResult.status}`);
      
      if (statsResult.status === 401) {
        console.log('   ⚠️  需要管理员权限（预期）');
      } else if (statsResult.status === 200) {
        const stats = statsResult.data?.data;
        console.log('   ✅ 获取到统计数据:');
        console.log(`      总订单数: ${stats?.total_orders || 0}`);
        console.log(`      总金额: $${stats?.total_amount || 0}`);
        console.log(`      待付款确认: ${stats?.pending_payment_orders || 0}`);
        console.log(`      已付款确认: ${stats?.confirmed_payment_orders || 0}`);
      } else if (statsResult.status === 500) {
        console.log('   ❌ 服务器错误');
        console.log('   响应:', typeof statsResult.data === 'string' ? statsResult.data.substring(0, 200) : JSON.stringify(statsResult.data));
      } else {
        console.log('   响应:', JSON.stringify(statsResult.data, null, 2));
      }
    }
    
    // 2. 检查订单列表API
    console.log('\n📋 2. 检查订单列表API...');
    const ordersOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=orders',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const ordersResult = await makeRequest(ordersOptions);
    console.log(`   订单列表状态码: ${ordersResult.status}`);
    
    if (ordersResult.status === 401) {
      console.log('   ⚠️  需要管理员权限（预期）');
    } else if (ordersResult.status === 200) {
      const orders = ordersResult.data?.data?.orders;
      console.log(`   ✅ 获取到订单列表，数量: ${orders?.length || 0}`);
      if (orders && orders.length > 0) {
        console.log('   最新订单:');
        orders.slice(0, 3).forEach(order => {
          console.log(`     ID:${order.id} 状态:${order.status} 金额:$${order.amount}`);
        });
      }
    } else {
      console.log('   响应:', JSON.stringify(ordersResult.data, null, 2));
    }
    
    // 3. 检查销售列表API
    console.log('\n👥 3. 检查销售列表API...');
    const salesOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=sales',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const salesResult = await makeRequest(salesOptions);
    console.log(`   销售列表状态码: ${salesResult.status}`);
    
    if (salesResult.status === 401) {
      console.log('   ⚠️  需要管理员权限（预期）');
    } else if (salesResult.status === 200) {
      const sales = salesResult.data?.data;
      console.log(`   ✅ 获取到销售列表，数量: ${sales?.length || 0}`);
      if (sales && sales.length > 0) {
        console.log('   最新销售:');
        sales.slice(0, 3).forEach(sale => {
          console.log(`     微信:${sale.wechat_name} 代码:${sale.sales_code} 订单:${sale.orders?.length || 0}`);
        });
      }
    } else {
      console.log('   响应:', JSON.stringify(salesResult.data, null, 2));
    }
    
    // 4. 模拟管理员登录来获取真实数据
    console.log('\n🔐 4. 提供管理员登录测试指导...');
    console.log('   由于API需要管理员权限，请手动验证:');
    console.log('   1. 登录管理员后台');
    console.log('   2. 打开浏览器开发者工具 > Network面板');
    console.log('   3. 访问数据概览页面');
    console.log('   4. 查看Network中的API请求:');
    console.log('      - 找到 "/api/admin?path=stats" 请求');
    console.log('      - 查看其响应数据');
    console.log('      - 确认 timeRange 参数是否为 "all"');
    console.log('   5. 如果API返回的数据正确但前端显示0，则是前端代码问题');
    console.log('   6. 如果API返回的数据就是0，则是后端查询问题');
    
    console.log('\n🔧 可能的问题和解决方案:');
    console.log('   问题1: 前端默认时间范围没有生效');
    console.log('     - 检查浏览器缓存是否已清空');
    console.log('     - 确认修改的代码是否真的部署了');
    console.log('   问题2: 后端SQL查询有问题');
    console.log('     - 检查orders表的字段名是否匹配');
    console.log('     - 检查时间过滤逻辑是否正确');
    console.log('   问题3: 数据库表结构问题');
    console.log('     - 订单可能存储在其他表中');
    console.log('     - 字段类型或格式不匹配');
    
    console.log('\n📊 下一步调试建议:');
    console.log('   1. 先确认修改的代码是否真的部署到了Vercel');
    console.log('   2. 在浏览器中手动访问数据概览，查看Network面板');
    console.log('   3. 检查API请求的URL和参数');
    console.log('   4. 查看API响应的具体数据');
    console.log('   5. 如果需要，我可以进一步检查代码逻辑');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

if (require.main === module) {
  diagnoseFrontendDataIssue();
}

module.exports = { diagnoseFrontendDataIssue };