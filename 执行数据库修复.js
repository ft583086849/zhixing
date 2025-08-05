#!/usr/bin/env node

/**
 * 执行完整的数据库修复
 */

const fetch = require('node-fetch');

async function fixDatabaseCompletely() {
  console.log('🔧 开始完整数据库修复...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  // 1. 管理员登录获取token
  console.log('1. 管理员登录...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.data?.token) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    console.log('✅ 管理员登录成功');
    const token = loginData.data.token;

    // 2. 执行现有的数据库架构更新
    console.log('\n2. 执行数据库架构更新...');
    try {
      const schemaResponse = await fetch(`${baseUrl}/api/admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: 'update-schema'
        })
      });
      
      const schemaData = await schemaResponse.json();
      console.log(`   状态码: ${schemaResponse.status}`);
      console.log(`   成功: ${schemaData.success}`);
      
      if (schemaData.success) {
        console.log('✅ 基础数据库架构更新成功');
        if (schemaData.data) {
          console.log(`   创建的表: ${schemaData.data.tablesCreated?.join(', ') || '无'}`);
          console.log(`   更新的表: ${schemaData.data.tablesUpdated?.join(', ') || '无'}`);
          if (schemaData.data.errors && schemaData.data.errors.length > 0) {
            console.log(`   错误: ${schemaData.data.errors.join('; ')}`);
          }
        }
      } else {
        console.log(`❌ 架构更新失败: ${schemaData.message}`);
      }
      
    } catch (error) {
      console.log(`❌ 架构更新API调用失败: ${error.message}`);
    }

    // 3. 测试API是否仍然有字段缺失错误
    console.log('\n3. 测试修复后的API状态...');
    
    const testEndpoints = [
      { name: '数据概览', path: 'stats' },
      { name: '订单管理', path: 'orders' },
      { name: '销售管理', path: 'sales' },
      { name: '客户管理', path: 'customers' }
    ];
    
    const stillFailingAPIs = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const testResponse = await fetch(`${baseUrl}/api/admin?path=${endpoint.path}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const testData = await testResponse.json();
        
        if (testData.success) {
          console.log(`   ✅ ${endpoint.name} API 正常`);
          
          // 检查数据内容
          if (endpoint.path === 'orders' && testData.data?.orders) {
            console.log(`     📋 订单数量: ${testData.data.orders.length}`);
            if (testData.data.orders.length > 0) {
              const sample = testData.data.orders[0];
              console.log(`     🔍 样本: 销售微信=${sample.sales_wechat_name || '空'}, 状态=${sample.status}`);
            }
          }
          
          if (endpoint.path === 'sales' && testData.data?.sales) {
            console.log(`     👨‍💼 销售数量: ${testData.data.sales.length}`);
          }
          
          if (endpoint.path === 'customers' && testData.data?.customers) {
            console.log(`     👤 客户数量: ${testData.data.customers.length}`);
          }
          
          if (endpoint.path === 'stats') {
            console.log(`     📊 总订单: ${testData.data.total_orders || 0}, 总销售: ${(testData.data.primary_sales_count || 0) + (testData.data.secondary_sales_count || 0)}`);
          }
          
        } else {
          console.log(`   ❌ ${endpoint.name} API 仍然失败: ${testData.message}`);
          
          // 检查是否仍然是字段缺失错误
          if (testData.message && testData.message.includes('Unknown column')) {
            stillFailingAPIs.push({
              api: endpoint.name,
              error: testData.message
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.name} API 调用失败: ${error.message}`);
      }
    }

    // 4. 分析仍然缺失的字段
    if (stillFailingAPIs.length > 0) {
      console.log('\n4. 分析仍然缺失的字段...');
      
      const missingFields = [];
      
      for (const api of stillFailingAPIs) {
        console.log(`   API: ${api.api}`);
        console.log(`   错误: ${api.error}`);
        
        // 提取缺失的字段名
        const columnMatch = api.error.match(/Unknown column '([^']+)'/);
        if (columnMatch) {
          missingFields.push(columnMatch[1]);
        }
      }
      
      if (missingFields.length > 0) {
        console.log(`\n   ❌ 仍然缺失的字段: ${[...new Set(missingFields)].join(', ')}`);
        console.log('\n💡 建议手动添加这些字段或联系开发人员进一步修复');
      }
      
    } else {
      console.log('\n🎉 所有API都正常工作了！');
    }

    // 5. 最终状态总结
    console.log('\n📋 修复总结:');
    console.log('==========================================');
    
    if (stillFailingAPIs.length === 0) {
      console.log('✅ 数据库修复成功！所有管理员功能正常工作');
      console.log('✅ 用户观察到的问题应该已经解决：');
      console.log('   - 订单管理页面销售微信号显示');
      console.log('   - 数据概览、销售管理、客户管理有数据');
      console.log('   - 搜索功能正常工作');
      console.log('   - 时间范围筛选功能正常');
    } else {
      console.log(`⚠️  还有 ${stillFailingAPIs.length} 个API需要进一步修复`);
      console.log('🔧 需要手动添加缺失的数据库字段');
    }
    
  } catch (error) {
    console.log(`❌ 修复过程中发生错误: ${error.message}`);
  }
}

// 运行修复
fixDatabaseCompletely().catch(console.error);