#!/usr/bin/env node

/**
 * 检查线上管理员系统 - 使用正确凭据
 * 部署版本: 0ebe88d
 */

const fetch = require('node-fetch');

async function checkAdminSystem() {
  console.log('🔍 检查线上管理员系统（部署版本: 0ebe88d）...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 1. 管理员登录测试
    console.log('1️⃣ 测试管理员登录...');
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   状态码: ${loginResponse.status}`);
    
    if (!loginData.success || !loginData.data?.token) {
      console.log('   ❌ 管理员登录失败');
      console.log(`   原因: ${loginData.message}`);
      return;
    }
    
    console.log('   ✅ 管理员登录成功');
    const token = loginData.data.token;

    // 2. 测试各个管理员API端点
    console.log('\n2️⃣ 测试管理员API端点...');
    
    const endpoints = [
      { name: '数据概览', path: 'stats' },
      { name: '订单管理', path: 'orders' },
      { name: '销售管理', path: 'sales' },
      { name: '客户管理', path: 'customers' },
      { name: '修复字段', path: 'fix-missing-fields' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`   📋 测试 ${endpoint.name} API...`);
        
        const testResponse = await fetch(`${baseUrl}/api/admin?path=${endpoint.path}`, {
          method: endpoint.path === 'fix-missing-fields' ? 'POST' : 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const testData = await testResponse.json();
        
        results[endpoint.name] = {
          status: testResponse.status,
          success: testData.success,
          message: testData.message,
          hasData: testData.data ? Object.keys(testData.data).length > 0 : false
        };
        
        if (testData.success) {
          console.log(`     ✅ ${endpoint.name}: 正常工作`);
          
          // 详细检查数据
          if (endpoint.path === 'orders' && testData.data?.orders) {
            const orders = testData.data.orders;
            console.log(`     📊 订单数量: ${orders.length}`);
            
            if (orders.length > 0) {
              const sample = orders[0];
              const hasWechat = sample.sales_wechat_name && sample.sales_wechat_name !== '-' && sample.sales_wechat_name !== null;
              console.log(`     🔍 销售微信号: ${hasWechat ? '✅ 正常显示' : '⚠️  为空'}`);
              console.log(`     🏷️  订单状态: ${sample.status}`);
              console.log(`     💰 订单金额: $${sample.amount}`);
            }
          }
          
          if (endpoint.path === 'sales' && testData.data) {
            const salesData = testData.data;
            console.log(`     👥 销售数量: ${salesData.length || 0}`);
            
            if (salesData.length > 0) {
              const sample = salesData[0];
              console.log(`     📋 销售类型: ${sample.sales_type || '未知'}`);
              console.log(`     💼 佣金比率: ${sample.commission_rate || 0}%`);
            }
          }
          
          if (endpoint.path === 'customers' && testData.data) {
            const customers = testData.data;
            console.log(`     👤 客户数量: ${customers.length || 0}`);
          }
          
          if (endpoint.path === 'stats' && testData.data) {
            const stats = testData.data;
            console.log(`     📈 总订单: ${stats.total_orders || 0}`);
            console.log(`     💵 总收入: $${stats.total_revenue || 0}`);
            console.log(`     👥 总销售: ${(stats.primary_sales_count || 0) + (stats.secondary_sales_count || 0)}`);
          }
          
          if (endpoint.path === 'fix-missing-fields') {
            console.log(`     🔧 修复功能可用: API响应正常`);
          }
          
        } else {
          console.log(`     ❌ ${endpoint.name}: ${testData.message}`);
          
          // 检查是否是字段缺失错误
          if (testData.message && testData.message.includes('Unknown column')) {
            console.log(`     💡 检测到字段缺失错误`);
          }
        }
        
      } catch (error) {
        console.log(`     ❌ ${endpoint.name}: 请求失败 - ${error.message}`);
        results[endpoint.name] = {
          status: 'error',
          success: false,
          message: error.message,
          hasData: false
        };
      }
    }

    // 3. 总结分析
    console.log('\n' + '='.repeat(60));
    console.log('📊 线上管理员系统状态总结');
    console.log('='.repeat(60));
    
    const workingApis = Object.values(results).filter(r => r.success).length;
    const totalApis = Object.keys(results).length;
    
    console.log(`✅ 正常工作的API: ${workingApis}/${totalApis}`);
    console.log(`❌ 有问题的API: ${totalApis - workingApis}/${totalApis}`);
    
    console.log('\n📋 详细状态:');
    Object.entries(results).forEach(([name, result]) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${name}: ${result.success ? '正常' : result.message}`);
    });

    // 4. 问题诊断和建议
    console.log('\n🔍 问题诊断:');
    
    const hasFieldErrors = Object.values(results).some(r => 
      r.message && r.message.includes('Unknown column')
    );
    
    if (hasFieldErrors) {
      console.log('   🚨 发现字段缺失问题 - 需要运行数据库修复');
      console.log('   💡 建议: 运行修复脚本或手动添加缺失字段');
    }
    
    if (workingApis === totalApis) {
      console.log('   🎉 所有功能正常工作！');
    } else if (workingApis > 0) {
      console.log('   ⚠️  部分功能正常，部分需要修复');
    } else {
      console.log('   🚨 系统存在严重问题，需要全面检查');
    }

    console.log('\n🎯 下一步建议:');
    if (results['修复字段']?.success) {
      console.log('   1. 数据库修复功能可用，可以运行修复脚本');
    }
    if (hasFieldErrors) {
      console.log('   2. 需要修复数据库字段缺失问题');
    }
    console.log('   3. 修复完成后重新验证所有功能');
    
  } catch (error) {
    console.log(`❌ 系统检查失败: ${error.message}`);
  }
}

checkAdminSystem().catch(console.error);