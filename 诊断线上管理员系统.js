#!/usr/bin/env node

/**
 * 诊断线上管理员系统的具体问题
 */

const fetch = require('node-fetch');

async function testOnlineAPI() {
  console.log('🔍 诊断线上管理员系统...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';

  // 1. 测试管理员登录API
  console.log('1. 测试管理员登录API...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   状态码: ${loginResponse.status}`);
    console.log(`   响应: ${JSON.stringify(loginData, null, 2)}`);
    
    if (loginData.success && loginData.data?.token) {
      console.log('   ✅ 登录成功');
      
      // 2. 使用token测试管理员API
      console.log('\n2. 测试管理员API (带认证)...');
      const token = loginData.data.token;
      
      const endpoints = ['stats', 'orders', 'sales', 'customers'];
      
      for (const endpoint of endpoints) {
        try {
          const apiResponse = await fetch(`${baseUrl}/api/admin?path=${endpoint}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const apiData = await apiResponse.json();
          console.log(`   API ${endpoint}:`);
          console.log(`     状态码: ${apiResponse.status}`);
          console.log(`     成功: ${apiData.success}`);
          
          if (apiData.success && apiData.data) {
            if (endpoint === 'orders' && apiData.data.orders) {
              console.log(`     订单数量: ${apiData.data.orders.length}`);
              if (apiData.data.orders.length > 0) {
                const sample = apiData.data.orders[0];
                console.log(`     样本订单: ID=${sample.id}, 销售微信=${sample.sales_wechat_name || '空'}, 状态=${sample.status}`);
              }
            }
            if (endpoint === 'sales' && apiData.data.sales) {
              console.log(`     销售数量: ${apiData.data.sales.length}`);
            }
            if (endpoint === 'customers' && apiData.data.customers) {
              console.log(`     客户数量: ${apiData.data.customers.length}`);
            }
            if (endpoint === 'stats') {
              console.log(`     总订单数: ${apiData.data.total_orders || 0}`);
              console.log(`     总销售数: ${(apiData.data.primary_sales_count || 0) + (apiData.data.secondary_sales_count || 0)}`);
            }
          } else {
            console.log(`     错误: ${apiData.message || '未知错误'}`);
          }
        } catch (error) {
          console.log(`     API ${endpoint} 调用失败: ${error.message}`);
        }
      }
      
    } else {
      console.log('   ❌ 登录失败');
      console.log(`   原因: ${loginData.message || '未知错误'}`);
      
      // 3. 尝试其他可能的管理员账户
      console.log('\n3. 尝试其他管理员账户...');
      const altAccounts = [
        { username: 'zhixing', password: 'admin123' },
        { username: 'admin', password: 'zhixing123' },
        { username: 'administrator', password: 'admin' }
      ];
      
      for (const account of altAccounts) {
        try {
          const altResponse = await fetch(`${baseUrl}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'login',
              ...account
            })
          });
          
          const altData = await altResponse.json();
          console.log(`   尝试 ${account.username}: ${altData.success ? '✅ 成功' : '❌ 失败'}`);
          
          if (altData.success) {
            console.log(`   找到有效账户: ${account.username}`);
            break;
          }
        } catch (error) {
          console.log(`   账户 ${account.username} 测试失败: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`   登录API调用失败: ${error.message}`);
  }

  // 4. 测试数据库健康检查API
  console.log('\n4. 测试数据库健康检查...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   健康检查状态: ${healthResponse.status}`);
    console.log(`   响应: ${JSON.stringify(healthData, null, 2)}`);
  } catch (error) {
    console.log(`   健康检查失败: ${error.message}`);
  }

  // 5. 测试创建管理员账户API
  console.log('\n5. 尝试创建默认管理员账户...');
  try {
    const createResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'create-admin',
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const createData = await createResponse.json();
    console.log(`   创建管理员状态: ${createResponse.status}`);
    console.log(`   响应: ${JSON.stringify(createData, null, 2)}`);
  } catch (error) {
    console.log(`   创建管理员失败: ${error.message}`);
  }
}

// 运行诊断
testOnlineAPI().catch(console.error);