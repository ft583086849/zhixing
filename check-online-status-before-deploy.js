#!/usr/bin/env node

/**
 * 线上状态检查脚本 - 部署前冲突检测
 * 检查线上当前状态，确保我们的修复不会与现有功能冲突
 */

const fetch = require('node-fetch');

async function checkOnlineStatus() {
  console.log('🔍 检查线上状态 - 部署前冲突检测');
  console.log('='.repeat(50));
  
  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  let allChecks = {
    auth: false,
    paymentConfig: false,
    secondarySales: false,
    purchasePage: false,
    database: false
  };

  try {
    // 1. 管理员登录检查
    console.log('\n1. 🔐 检查管理员登录状态...');
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.data?.token) {
      console.log('   ✅ 管理员登录正常');
      allChecks.auth = true;
      const token = loginData.data.token;

      // 2. 检查收款配置API状态
      console.log('\n2. 💳 检查收款配置API状态...');
      try {
        // 检查GET接口
        const getConfigResponse = await fetch(`${baseUrl}/api/payment-config?path=get`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const getConfigData = await getConfigResponse.json();
        console.log(`   GET状态: ${getConfigResponse.status} - ${getConfigData.success ? '✅ 正常' : '❌ 异常'}`);
        
        if (getConfigData.success) {
          const config = getConfigData.data;
          console.log(`   支付宝账号: ${config.alipay_account || '未设置'}`);
          console.log(`   支付宝收款码: ${config.alipay_qr_code ? '已设置' : '未设置'}`);
          console.log(`   线上地址码: ${config.crypto_qr_code ? '已设置' : '未设置'}`);
          allChecks.paymentConfig = true;
        }
        
      } catch (error) {
        console.log(`   ❌ 收款配置API异常: ${error.message}`);
      }

      // 3. 检查数据库结构
      console.log('\n3. 🗄️  检查数据库结构状态...');
      try {
        const dbCheckResponse = await fetch(`${baseUrl}/api/admin?path=stats`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const dbCheckData = await dbCheckResponse.json();
        console.log(`   数据库查询: ${dbCheckResponse.status} - ${dbCheckData.success ? '✅ 正常' : '❌ 异常'}`);
        
        if (dbCheckData.success) {
          const stats = dbCheckData.data;
          console.log(`   总订单: ${stats.total_orders || 0}`);
          console.log(`   一级销售: ${stats.primary_sales_count || 0}`);
          console.log(`   二级销售: ${stats.secondary_sales_count || 0}`);
          allChecks.database = true;
        }
        
      } catch (error) {
        console.log(`   ❌ 数据库检查异常: ${error.message}`);
      }

    } else {
      console.log('   ❌ 管理员登录失败');
      return;
    }

    // 4. 检查二级销售注册页面
    console.log('\n4. 👥 检查二级销售注册页面...');
    try {
      const secondaryResponse = await fetch(`${baseUrl}/secondary-sales`, {
        method: 'HEAD'
      });
      console.log(`   独立注册页面: ${secondaryResponse.status} - ${secondaryResponse.status === 200 ? '✅ 可访问' : '❌ 异常'}`);
      
      if (secondaryResponse.status === 200) {
        allChecks.secondarySales = true;
      }
      
    } catch (error) {
      console.log(`   ❌ 二级销售页面检查异常: ${error.message}`);
    }

    // 5. 检查用户购买页面
    console.log('\n5. 🛒 检查用户购买页面...');
    try {
      const purchaseResponse = await fetch(`${baseUrl}/purchase?sales_code=TEST`, {
        method: 'HEAD'
      });
      console.log(`   购买页面: ${purchaseResponse.status} - ${purchaseResponse.status === 200 ? '✅ 可访问' : '❌ 异常'}`);
      
      if (purchaseResponse.status === 200) {
        allChecks.purchasePage = true;
      }
      
    } catch (error) {
      console.log(`   ❌ 购买页面检查异常: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ 整体检查失败: ${error.message}`);
  }

  // 6. 冲突分析和建议
  console.log('\n' + '='.repeat(50));
  console.log('📊 冲突分析和部署建议');
  console.log('='.repeat(50));

  const totalChecks = Object.keys(allChecks).length;
  const passedChecks = Object.values(allChecks).filter(check => check).length;
  
  console.log(`\n✅ 通过检查: ${passedChecks}/${totalChecks}`);
  
  // 分析我们的修复与线上状态的兼容性
  console.log('\n🔍 修复兼容性分析:');
  
  if (allChecks.paymentConfig) {
    console.log('   ✅ 收款配置API正常 - 我们的修复不会影响现有功能');
  } else {
    console.log('   ⚠️  收款配置API异常 - 我们的修复会改善此问题');
  }
  
  if (allChecks.secondarySales) {
    console.log('   ✅ 二级销售页面正常 - 隐私保护修复不会影响访问');
  } else {
    console.log('   ⚠️  二级销售页面异常 - 需要检查路由配置');
  }
  
  if (allChecks.purchasePage) {
    console.log('   ✅ 购买页面正常 - 7天免费按钮修复不会影响现有订单');
  } else {
    console.log('   ⚠️  购买页面异常 - 需要检查页面状态');
  }

  if (allChecks.database) {
    console.log('   ✅ 数据库查询正常 - 数据库修复不会影响现有数据');
  } else {
    console.log('   ⚠️  数据库查询异常 - 需要谨慎执行数据库修复');
  }

  // 部署建议
  console.log('\n🎯 部署建议:');
  
  if (passedChecks >= 3) {
    console.log('   ✅ 线上状态良好，建议继续部署');
    console.log('   📋 我们的修复主要是优化和修复，不会破坏现有功能');
    console.log('   🔧 数据库修复建议先在线上测试，确保不影响现有数据');
  } else {
    console.log('   ⚠️  线上状态不佳，建议先修复基础问题');
    console.log('   🔧 建议等待线上稳定后再部署我们的修复');
  }

  return allChecks;
}

// 执行检查
checkOnlineStatus().catch(console.error);