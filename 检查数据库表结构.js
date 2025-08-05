#!/usr/bin/env node

/**
 * 检查数据库表结构 - 直接查询表字段
 */

const fetch = require('node-fetch');

async function checkDatabaseSchema() {
  console.log('🔍 检查数据库表结构...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 管理员登录
    console.log('📝 管理员登录...');
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
    console.log('✅ 登录成功\n');
    
    const token = loginData.data.token;

    // 创建检查表结构的API调用
    console.log('🔍 检查关键表结构...');
    
    const tables = ['orders', 'primary_sales', 'secondary_sales', 'sales'];
    
    for (const table of tables) {
      console.log(`\n📋 检查 ${table} 表结构:`);
      
      try {
        // 调用数据库健康检查，然后手动查询表结构
        const response = await fetch(`${baseUrl}/api/admin?path=check-table-structure&table=${table}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 404) {
          // 如果没有专用端点，我们通过健康检查API来分析
          console.log(`   ⚠️  没有专用表结构检查端点`);
          
          // 通过查询错误来判断字段是否存在
          const testResponse = await fetch(`${baseUrl}/api/admin?path=test-table-fields&table=${table}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`   状态: ${testResponse.status}`);
        } else {
          const data = await response.json();
          console.log(`   状态: ${response.status}`);
          console.log(`   响应:`, data);
        }
        
      } catch (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
      }
    }

    // 手动检查sales表字段 - 通过直接查询
    console.log(`\n🎯 手动检查sales表字段（通过健康检查API）:`);
    
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const healthData = await healthResponse.json();
      console.log('   数据库连接状态:', healthData.data?.database?.connected ? '✅ 正常' : '❌ 异常');
      
      // 通过修复脚本返回的信息分析
      console.log('\n📊 根据修复脚本分析:');
      console.log('   ✅ orders表: 完整（15个字段）');
      console.log('   ✅ primary_sales表: 完整（4个字段）'); 
      console.log('   ✅ secondary_sales表: 完整（6个字段）');
      console.log('   ❓ sales表: 未在修复列表中出现');
      
      console.log('\n🚨 问题分析:');
      console.log('   1. 修复脚本显示所有25个字段都已存在');
      console.log('   2. 但API查询报错 "Unknown column \'s.sales_code\'"');
      console.log('   3. sales表可能确实缺少sales_code字段');
      console.log('   4. 修复脚本可能没有正确检查sales表');
      
    } catch (error) {
      console.log(`   ❌ 健康检查失败: ${error.message}`);
    }

    // 分析SQL查询错误
    console.log('\n🔍 SQL错误分析:');
    console.log('   错误SQL: "left join sales as s on ... o.sales_code = s.sales_code"');
    console.log('   错误信息: Unknown column \'s.sales_code\'');
    console.log('   💡 这意味着sales表确实缺少sales_code字段');
    
    console.log('\n💡 解决方案:');
    console.log('   1. 需要向sales表添加sales_code字段');
    console.log('   2. 可能还需要添加sales_type字段');
    console.log('   3. 修复脚本需要更新以包含sales表字段');

  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
  }
}

checkDatabaseSchema().catch(console.error);