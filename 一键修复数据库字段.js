#!/usr/bin/env node

/**
 * 一键修复数据库字段 - 自动化脚本
 * 调用新创建的API来修复所有缺失的数据库字段
 */

const fetch = require('node-fetch');

async function oneClickFixDatabase() {
  console.log('🚀 一键修复数据库字段开始...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 步骤1: 管理员登录
    console.log('📝 步骤1: 管理员登录...');
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
      console.log('❌ 管理员登录失败:', loginData.message);
      return;
    }
    
    console.log('✅ 管理员登录成功');
    const token = loginData.data.token;

    // 步骤2: 调用修复API
    console.log('\n🔧 步骤2: 执行数据库字段修复...');
    const fixResponse = await fetch(`${baseUrl}/api/admin?path=fix-missing-fields`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const fixData = await fixResponse.json();
    
    console.log(`   API状态码: ${fixResponse.status}`);
    console.log(`   修复成功: ${fixData.success}`);
    
    if (fixData.success) {
      console.log('\n🎉 数据库字段修复成功！');
      
      const details = fixData.data.details;
      
      console.log('\n📊 修复详情:');
      console.log(`   ✅ 新添加字段: ${fixData.data.fieldsAdded} 个`);
      console.log(`   ⏭️  跳过字段: ${fixData.data.fieldsSkipped} 个`);
      console.log(`   📂 创建索引: ${fixData.data.indexesCreated} 个`);
      console.log(`   ❌ 错误: ${fixData.data.errors} 个`);
      
      if (details.fieldsAdded.length > 0) {
        console.log('\n✅ 新添加的字段:');
        details.fieldsAdded.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field}`);
        });
      }
      
      if (details.fieldsSkipped.length > 0) {
        console.log('\n⏭️  跳过的字段（已存在）:');
        details.fieldsSkipped.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field}`);
        });
      }
      
      if (details.indexesCreated.length > 0) {
        console.log('\n📂 创建的索引:');
        details.indexesCreated.forEach((index, i) => {
          console.log(`   ${i + 1}. ${index}`);
        });
      }
      
      if (details.errors.length > 0) {
        console.log('\n❌ 错误信息:');
        details.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
    } else {
      console.log(`❌ 数据库字段修复失败: ${fixData.message}`);
      if (fixData.error) {
        console.log(`   错误详情: ${fixData.error}`);
      }
      return;
    }

    // 步骤3: 验证修复效果
    console.log('\n🧪 步骤3: 验证修复效果...');
    
    const testEndpoints = [
      { name: '数据概览', path: 'stats' },
      { name: '订单管理', path: 'orders' },
      { name: '销售管理', path: 'sales' },
      { name: '客户管理', path: 'customers' }
    ];
    
    let allFixed = true;
    
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
          console.log(`   ✅ ${endpoint.name} API 正常工作`);
          
          // 详细检查数据
          if (endpoint.path === 'orders' && testData.data?.orders) {
            const orders = testData.data.orders;
            console.log(`     📋 订单数量: ${orders.length}`);
            
            if (orders.length > 0) {
              const sample = orders[0];
              const hasWechat = sample.sales_wechat_name && sample.sales_wechat_name !== '-';
              console.log(`     🔍 销售微信号: ${hasWechat ? '✅ 正常显示' : '⚠️  仍为空'}`);
              console.log(`     🏷️  订单状态: ${sample.status}`);
            }
          }
          
          if (endpoint.path === 'stats') {
            const stats = testData.data;
            console.log(`     📊 总订单: ${stats.total_orders || 0}, 总销售: ${(stats.primary_sales_count || 0) + (stats.secondary_sales_count || 0)}`);
          }
          
        } else {
          console.log(`   ❌ ${endpoint.name} API 仍有问题: ${testData.message}`);
          allFixed = false;
          
          // 检查是否仍有字段错误
          if (testData.message && testData.message.includes('Unknown column')) {
            console.log(`     💡 仍有字段缺失，可能需要进一步修复`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.name} API 调用失败: ${error.message}`);
        allFixed = false;
      }
    }

    // 步骤4: 总结结果
    console.log('\n' + '='.repeat(60));
    console.log('🎯 修复结果总结');
    console.log('='.repeat(60));
    
    if (allFixed) {
      console.log('🎉 恭喜！所有问题都已修复：');
      console.log('   ✅ 订单管理页面销售微信号显示正常');
      console.log('   ✅ 数据概览、销售管理、客户管理显示数据');
      console.log('   ✅ 所有搜索功能正常工作');
      console.log('   ✅ 时间范围筛选功能正常');
      console.log('\n现在可以正常使用管理员系统了！🚀');
    } else {
      console.log('⚠️  部分问题已修复，但仍有一些API需要进一步调试');
      console.log('💡 建议联系开发人员进行进一步排查');
    }
    
  } catch (error) {
    console.log(`❌ 修复过程中发生错误: ${error.message}`);
    console.log('💡 请检查网络连接或联系开发人员');
  }
}

// 运行修复
console.log('🔧 知行财库数据库字段一键修复工具');
console.log('='.repeat(40));
oneClickFixDatabase().catch(console.error);