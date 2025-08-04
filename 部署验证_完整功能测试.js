#!/usr/bin/env node

/**
 * 部署验证 - 完整功能测试
 * 验证所有修复功能是否生效
 */

const https = require('https');

const API_BASE = 'https://zhixing-seven.vercel.app/api';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Verification/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData,
            raw: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test1_HealthCheck() {
  console.log('🔍 测试1: API健康检查...');
  try {
    const result = await makeRequest('/health');
    console.log(`   状态: ${result.status}`);
    console.log(`   版本: ${result.data.data?.version || 'N/A'}`);
    console.log(`   数据库: ${result.data.data?.database?.message || 'N/A'}`);
    return result.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function test2_PrimarySalesCreation() {
  console.log('\n🔍 测试2: 一级销售创建功能...');
  try {
    const testData = {
      wechat_name: 'test_primary_sales',
      payment_method: 'alipay',
      payment_address: 'test@alipay.com',
      alipay_surname: '测试',
      chain_name: '测试链'
    };
    
    const result = await makeRequest('/primary-sales', 'POST', testData);
    console.log(`   状态: ${result.status}`);
    console.log(`   响应: ${result.data.message || result.data}`);
    
    if (result.data.data?.sales_code) {
      console.log(`   ✅ 生成销售代码: ${result.data.data.sales_code}`);
      return { success: true, sales_code: result.data.data.sales_code };
    } else {
      console.log(`   ❌ 未生成销售代码`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return { success: false };
  }
}

async function test3_SalesCodeLookup(salesCode) {
  console.log('\n🔍 测试3: sales_code查找功能...');
  try {
    const result = await makeRequest(`/sales?sales_code=${salesCode}`);
    console.log(`   状态: ${result.status}`);
    console.log(`   响应: ${result.data.message || result.data}`);
    
    if (result.status === 200 && result.data.success) {
      console.log(`   ✅ 销售代码查找成功`);
      return true;
    } else if (result.data.message === '下单拥挤，请等待') {
      console.log(`   ❌ 仍然返回"下单拥挤，请等待"`);
      return false;
    } else {
      console.log(`   ⚠️  其他响应: ${result.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function test4_OrderCreation(salesCode) {
  console.log('\n🔍 测试4: 用户购买订单创建...');
  try {
    const orderData = {
      sales_code: salesCode,
      customer_wechat: 'test_customer_' + Date.now(),
      tradingview_username: 'test_tv_user',
      package_type: '7_days_free',
      amount: 0
    };
    
    const result = await makeRequest('/orders', 'POST', orderData);
    console.log(`   状态: ${result.status}`);
    console.log(`   响应: ${result.data.message || result.data}`);
    
    if (result.status === 201 && result.data.success) {
      console.log(`   ✅ 订单创建成功`);
      return true;
    } else if (result.data.message === '下单拥挤，请等待') {
      console.log(`   ❌ 仍然返回"下单拥挤，请等待"`);
      return false;
    } else {
      console.log(`   ⚠️  其他错误: ${result.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function test5_AdminAPI() {
  console.log('\n🔍 测试5: 管理员API功能...');
  try {
    // 测试数据概览
    const statsResult = await makeRequest('/admin?action=stats');
    console.log(`   数据概览状态: ${statsResult.status}`);
    
    if (statsResult.status === 401) {
      console.log(`   ✅ 需要认证（正常保护）`);
      return true;
    } else if (statsResult.status === 200) {
      console.log(`   ✅ API响应正常`);
      return true;
    } else {
      console.log(`   ⚠️  意外状态: ${statsResult.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 开始部署验证 - 完整功能测试\n');
  console.log('='.repeat(60));
  
  const results = {
    health: false,
    primarySales: false,
    salesLookup: false,
    orderCreation: false,
    adminAPI: false
  };
  
  let salesCode = null;
  
  // 测试1: 健康检查
  results.health = await test1_HealthCheck();
  
  // 测试2: 一级销售创建
  const primaryResult = await test2_PrimarySalesCreation();
  results.primarySales = primaryResult.success;
  salesCode = primaryResult.sales_code;
  
  // 测试3: 销售代码查找
  if (salesCode) {
    results.salesLookup = await test3_SalesCodeLookup(salesCode);
  } else {
    console.log('\n🔍 测试3: 跳过 - 无可用销售代码');
  }
  
  // 测试4: 订单创建
  if (salesCode) {
    results.orderCreation = await test4_OrderCreation(salesCode);
  } else {
    console.log('\n🔍 测试4: 跳过 - 无可用销售代码');
  }
  
  // 测试5: 管理员API
  results.adminAPI = await test5_AdminAPI();
  
  // 汇总结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果汇总:');
  console.log(`✅ API健康检查: ${results.health ? '通过' : '失败'}`);
  console.log(`✅ 一级销售创建: ${results.primarySales ? '通过' : '失败'}`);
  console.log(`✅ 销售代码查找: ${results.salesLookup ? '通过' : '失败'}`);
  console.log(`✅ 订单创建功能: ${results.orderCreation ? '通过' : '失败'}`);
  console.log(`✅ 管理员API: ${results.adminAPI ? '通过' : '失败'}`);
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;
  
  console.log(`\n📈 总体通过率: ${passedCount}/${totalCount} (${(passedCount/totalCount*100).toFixed(1)}%)`);
  
  if (passedCount === totalCount) {
    console.log('🎉 所有功能验证通过！部署成功！');
  } else {
    console.log('⚠️  部分功能仍有问题，需要进一步调试。');
  }
  
  // 具体建议
  if (!results.primarySales) {
    console.log('\n💡 建议: 检查一级销售创建API的数据库字段问题');
  }
  if (!results.salesLookup || !results.orderCreation) {
    console.log('\n💡 建议: 检查sales_code统一查找逻辑是否正确部署');
  }
}

if (require.main === module) {
  main();
}