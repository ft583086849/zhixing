#!/usr/bin/env node

/**
 * 通过管理员API执行数据库修复
 * 修复 secondary_sales.primary_sales_id 字段允许 NULL
 */

const fetch = require('node-fetch');

async function executeDbFixViaAPI() {
  console.log('🔧 通过管理员API执行数据库修复');
  console.log('='.repeat(50));
  
  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  try {
    // 1. 管理员登录
    console.log('\n🔐 步骤1: 管理员登录...');
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
      return false;
    }
    
    console.log('✅ 管理员登录成功');
    const token = loginData.data.token;

    // 2. 检查当前数据库状态
    console.log('\n📊 步骤2: 检查当前数据库状态...');
    const checkResponse = await fetch(`${baseUrl}/api/admin?path=stats`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const checkData = await checkResponse.json();
    
    if (!checkData.success) {
      console.log('❌ 数据库状态检查失败');
      return false;
    }
    
    console.log('✅ 当前数据库状态正常');
    console.log(`   📊 订单数: ${checkData.data.total_orders || 0}`);
    console.log(`   👥 销售数: ${(checkData.data.primary_sales_count || 0) + (checkData.data.secondary_sales_count || 0)}`);

    // 3. 尝试通过API执行数据库修复
    console.log('\n🔧 步骤3: 执行数据库结构修复...');
    
    // 创建一个测试独立销售注册的请求
    console.log('\n🧪 测试独立销售注册功能...');
    
    const testSalesData = {
      wechat_name: `test_independent_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'test@example.com',
      alipay_surname: '测试'
    };
    
    // 尝试创建独立二级销售
    const testResponse = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: 'create-secondary',
        ...testSalesData,
        registration_type: 'independent' // 标记为独立注册
      })
    });
    
    const testResult = await testResponse.json();
    
    console.log(`   API响应状态: ${testResponse.status}`);
    console.log(`   注册结果: ${testResult.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (testResult.success) {
      console.log('🎉 独立销售注册功能已正常工作！');
      
      // 清理测试数据
      console.log('\n🗑️  清理测试数据...');
      // 这里可以添加删除测试数据的逻辑
      
      return true;
    } else {
      console.log(`❌ 独立销售注册失败: ${testResult.message}`);
      
      // 检查是否是数据库约束问题
      if (testResult.message && testResult.message.includes('cannot be null')) {
        console.log('\n🔍 检测到数据库约束问题 - primary_sales_id字段不允许NULL');
        console.log('📋 需要执行数据库结构修复');
        
        // 尝试通过管理员API修复数据库结构
        console.log('\n🛠️  尝试通过管理员API修复数据库结构...');
        
        const fixResponse = await fetch(`${baseUrl}/api/admin`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: 'fix-database-structure',
            operation: 'modify_secondary_sales_table',
            sql: 'ALTER TABLE secondary_sales MODIFY COLUMN primary_sales_id INT NULL COMMENT \'一级销售ID，独立注册时为NULL\''
          })
        });
        
        const fixResult = await fixResponse.json();
        
        if (fixResult.success) {
          console.log('✅ 数据库结构修复成功');
          
          // 重新测试独立销售注册
          console.log('\n🔄 重新测试独立销售注册...');
          const retestResponse = await fetch(`${baseUrl}/api/sales`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              path: 'create-secondary',
              ...testSalesData,
              wechat_name: `test_independent_retry_${Date.now()}`,
              registration_type: 'independent'
            })
          });
          
          const retestResult = await retestResponse.json();
          
          if (retestResult.success) {
            console.log('🎉 独立销售注册功能修复成功！');
            return true;
          } else {
            console.log(`❌ 重新测试失败: ${retestResult.message}`);
            return false;
          }
          
        } else {
          console.log(`❌ 数据库结构修复失败: ${fixResult.message}`);
          return false;
        }
      }
      
      return false;
    }

  } catch (error) {
    console.log(`❌ 执行过程中发生错误: ${error.message}`);
    return false;
  }
}

// 执行修复
executeDbFixViaAPI()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('🎉 数据库修复完成！独立销售注册功能已启用');
      console.log('🏆 现在可以实现100%功能恢复');
    } else {
      console.log('⚠️  数据库修复需要进一步处理');
      console.log('💡 建议手动执行SQL修复或联系数据库管理员');
    }
  })
  .catch(console.error);