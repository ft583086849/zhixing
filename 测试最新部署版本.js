#!/usr/bin/env node

/**
 * 测试最新部署版本是否包含sales表字段修复
 */

const fetch = require('node-fetch');

async function testLatestDeployment() {
  console.log('🔍 测试最新部署版本（期望包含sales表字段修复）...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 登录
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.log('❌ 登录失败');
      return;
    }
    
    const token = loginData.data.token;

    // 直接调用修复API并输出详细信息
    console.log('🔧 调用修复API，检查字段列表...');
    
    const fixResponse = await fetch(`${baseUrl}/api/admin?path=fix-missing-fields`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const fixData = await fixResponse.json();
    
    console.log(`状态码: ${fixResponse.status}`);
    console.log(`成功: ${fixData.success}`);
    
    if (fixData.success && fixData.data?.details) {
      const details = fixData.data.details;
      
      console.log('\n📊 详细分析:');
      console.log(`新添加字段: ${details.fieldsAdded.length}个`);
      console.log(`跳过字段: ${details.fieldsSkipped.length}个`);
      console.log(`错误: ${details.errors.length}个`);
      
      // 检查是否包含sales表字段
      const salesFields = details.fieldsSkipped.filter(field => field.startsWith('sales.'));
      const salesFieldsAdded = details.fieldsAdded.filter(field => field.startsWith('sales.'));
      
      console.log('\n🔍 sales表字段分析:');
      if (salesFields.length > 0) {
        console.log('✅ 跳过的sales表字段（已存在）:');
        salesFields.forEach(field => console.log(`   ${field}`));
      }
      
      if (salesFieldsAdded.length > 0) {
        console.log('✅ 新添加的sales表字段:');
        salesFieldsAdded.forEach(field => console.log(`   ${field}`));
      }
      
      if (salesFields.length === 0 && salesFieldsAdded.length === 0) {
        console.log('❌ 没有发现sales表字段 - 说明修复脚本可能还没包含sales表字段');
        console.log('💡 这解释了为什么API仍然报错');
      }
      
      // 检查具体缺少哪些字段
      const expectedSalesFields = ['sales.sales_code', 'sales.sales_type'];
      const missingSalesFields = expectedSalesFields.filter(expected => 
        !salesFields.includes(expected) && !salesFieldsAdded.includes(expected)
      );
      
      if (missingSalesFields.length > 0) {
        console.log('\n🚨 确实缺少的sales表字段:');
        missingSalesFields.forEach(field => console.log(`   ${field}`));
      }
      
    } else {
      console.log('❌ 修复API调用失败');
      console.log('响应:', fixData);
    }

  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
}

testLatestDeployment().catch(console.error);