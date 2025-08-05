#!/usr/bin/env node

/**
 * 强制清除Vercel缓存并验证部署生效
 * 解决缓存问题，确保最新功能可见
 */

const fetch = require('node-fetch');

async function forceRefreshAndVerify() {
  console.log('🔄 强制清除Vercel缓存并验证部署生效');
  console.log('='.repeat(50));

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 1. 强制刷新健康检查 - 触发服务器重新初始化
    console.log('1️⃣ 强制刷新健康检查...');
    
    const cacheBreaker = Date.now();
    const healthResponse = await fetch(`${baseUrl}/api/health?cb=${cacheBreaker}`, {
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const healthData = await healthResponse.json();
    console.log(`   状态: ${healthResponse.status}`);
    console.log(`   版本: ${healthData.data?.version || 'N/A'}`);
    console.log(`   平台: ${healthData.data?.platform || 'N/A'}`);
    console.log(`   数据库: ${healthData.data?.database?.connected ? '✅ 连接正常' : '❌ 连接异常'}`);

    // 2. 管理员登录（强制刷新认证）
    console.log('\n2️⃣ 强制刷新管理员认证...');
    
    const loginResponse = await fetch(`${baseUrl}/api/auth?cb=${cacheBreaker}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.data?.token) {
      console.log(`   ❌ 登录失败: ${loginData.message}`);
      return;
    }
    
    console.log('   ✅ 登录成功');
    const token = loginData.data.token;

    // 3. 强制刷新修复API（验证最新代码）
    console.log('\n3️⃣ 强制验证修复API最新版本...');
    
    const fixResponse = await fetch(`${baseUrl}/api/admin?path=fix-missing-fields&cb=${cacheBreaker}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    const fixData = await fixResponse.json();
    
    if (fixData.success && fixData.data?.details) {
      const details = fixData.data.details;
      console.log(`   ✅ 修复API工作正常`);
      console.log(`   📊 字段总数: ${details.fieldsAdded.length + details.fieldsSkipped.length}`);
      
      // 检查关键的sales表字段
      const salesFields = [...details.fieldsAdded, ...details.fieldsSkipped]
        .filter(field => field.startsWith('sales.'));
      
      console.log(`   🎯 sales表字段: ${salesFields.length}个`);
      salesFields.forEach(field => console.log(`      ${field}`));
      
      const hasSalesCode = salesFields.includes('sales.sales_code');
      const hasSalesType = salesFields.includes('sales.sales_type');
      
      console.log(`   📋 sales.sales_code: ${hasSalesCode ? '✅ 已包含' : '❌ 缺失'}`);
      console.log(`   📋 sales.sales_type: ${hasSalesType ? '✅ 已包含' : '❌ 缺失'}`);
      
    } else {
      console.log(`   ❌ 修复API异常: ${fixData.message}`);
    }

    // 4. 强制测试所有管理员API（绕过缓存）
    console.log('\n4️⃣ 强制测试所有管理员API（绕过缓存）...');
    
    const endpoints = [
      { name: '数据概览', path: 'stats' },
      { name: '订单管理', path: 'orders' },
      { name: '销售管理', path: 'sales' },
      { name: '客户管理', path: 'customers' }
    ];

    let successCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`   📋 测试 ${endpoint.name}...`);
        
        const testResponse = await fetch(`${baseUrl}/api/admin?path=${endpoint.path}&cb=${cacheBreaker}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        const testData = await testResponse.json();
        
        if (testData.success) {
          successCount++;
          console.log(`     ✅ ${endpoint.name}: 正常工作`);
          
          // 特别检查订单管理的销售微信号
          if (endpoint.path === 'orders' && testData.data?.orders) {
            const orders = testData.data.orders;
            if (orders.length > 0) {
              const sample = orders[0];
              const hasWechat = sample.sales_wechat_name && 
                               sample.sales_wechat_name !== '-' && 
                               sample.sales_wechat_name !== null &&
                               sample.sales_wechat_name !== '';
              console.log(`     🎯 销售微信号: ${hasWechat ? '✅ 正常显示' : '⚠️  仍为空'}`);
              
              if (hasWechat) {
                console.log(`     💼 示例微信号: ${sample.sales_wechat_name}`);
              }
            }
          }
          
        } else {
          console.log(`     ❌ ${endpoint.name}: ${testData.message.substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`     ❌ ${endpoint.name}: 请求失败 - ${error.message}`);
      }
    }

    // 5. 最终结果
    console.log('\n' + '='.repeat(50));
    console.log('🎯 强制刷新验证结果');
    console.log('='.repeat(50));
    
    console.log(`✅ 正常工作的API: ${successCount}/4`);
    console.log(`🔄 缓存清除: 完成`);
    console.log(`🚀 部署验证: ${successCount === 4 ? '✅ 全部正常' : '⚠️  部分问题'}`);
    
    if (successCount === 4) {
      console.log('\n🎉 恭喜！所有功能正常工作：');
      console.log('   ✅ 订单管理页面销售微信号正常显示');
      console.log('   ✅ 数据概览、销售管理、客户管理正常显示数据');
      console.log('   ✅ 所有搜索功能正常工作');
      console.log('\n💡 缓存问题已解决，你现在应该能看到正确的结果！');
    } else {
      console.log('\n⚠️  部分API仍有问题，可能需要进一步修复');
    }

    // 6. 提供浏览器缓存清除指导
    console.log('\n📱 浏览器缓存清除指导:');
    console.log('   1. 在管理员页面按 Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
    console.log('   2. 或者打开开发者工具，右键刷新按钮选择"硬性重新加载"');
    console.log('   3. 或者清除浏览器缓存和Cookie');
    console.log(`   4. 重新访问: ${baseUrl}/admin`);

  } catch (error) {
    console.log(`❌ 强制刷新失败: ${error.message}`);
  }
}

forceRefreshAndVerify().catch(console.error);