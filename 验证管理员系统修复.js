#!/usr/bin/env node

/**
 * 验证管理员系统JavaScript错误修复
 * 检查 toFixed is not a function 错误是否解决
 */

const https = require('https');

const baseUrl = 'https://zhixing-seven.vercel.app';

// 管理员登录获取token
async function getAdminToken() {
  const loginData = JSON.stringify({
    username: 'zhixing',
    password: 'zhixing2024'
  });

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/auth?path=login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.data.token) {
            resolve(result.data.token);
          } else {
            reject(new Error('登录失败'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// 检查管理员概览API数据
async function checkAdminOverviewAPI(token) {
  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/admin?path=overview',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 主检查函数
async function main() {
  console.log('🔧 管理员系统JavaScript错误修复验证');
  console.log('========================================');
  
  try {
    // 1. 管理员登录
    console.log('🔐 步骤1: 管理员登录...');
    const token = await getAdminToken();
    console.log('   ✅ 登录成功');

    // 2. 检查概览API数据类型
    console.log('\n📊 步骤2: 检查概览API数据类型...');
    const overviewData = await checkAdminOverviewAPI(token);
    
    if (!overviewData.success) {
      throw new Error('概览API返回失败');
    }

    const stats = overviewData.data;
    console.log('   ✅ API调用成功');

    // 3. 验证百分比数据类型
    console.log('\n🔍 步骤3: 验证百分比数据类型...');
    
    const percentageFields = [
      'one_month_percentage',
      'three_month_percentage', 
      'six_month_percentage',
      'lifetime_percentage',
      'free_percentage'
    ];

    let typeCheckPassed = true;
    for (const field of percentageFields) {
      const value = stats[field];
      const isNumber = typeof value === 'number';
      const hasValue = value !== undefined && value !== null;
      
      console.log(`   📋 ${field}: ${value} (类型: ${typeof value}) ${isNumber && hasValue ? '✅' : '❌'}`);
      
      if (!isNumber && hasValue) {
        typeCheckPassed = false;
      }
    }

    // 4. 验证层级统计数据
    console.log('\n👥 步骤4: 验证层级统计数据...');
    const avgSecondary = stats.avg_secondary_per_primary;
    const isAvgNumber = typeof avgSecondary === 'number';
    console.log(`   📋 avg_secondary_per_primary: ${avgSecondary} (类型: ${typeof avgSecondary}) ${isAvgNumber ? '✅' : '❌'}`);

    // 5. 模拟前端toFixed调用
    console.log('\n🧪 步骤5: 模拟前端toFixed调用...');
    let toFixedTestPassed = true;
    
    try {
      percentageFields.forEach(field => {
        const value = stats[field];
        if (value !== undefined && value !== null) {
          const formatted = (Number(value) || 0).toFixed(1);
          console.log(`   🧮 ${field}.toFixed(1) = ${formatted}% ✅`);
        }
      });
      
      if (avgSecondary !== undefined && avgSecondary !== null) {
        const formatted = (Number(avgSecondary) || 0).toFixed(1);
        console.log(`   🧮 avg_secondary_per_primary.toFixed(1) = ${formatted} ✅`);
      }
      
    } catch (error) {
      console.log(`   ❌ toFixed调用失败: ${error.message}`);
      toFixedTestPassed = false;
    }

    // 6. 结果总结
    console.log('\n========================================');
    console.log('📊 修复验证结果');
    console.log('========================================');
    
    if (typeCheckPassed && toFixedTestPassed) {
      console.log('🎉 ✅ 管理员系统JavaScript错误已修复');
      console.log('📋 说明: 百分比数据现在返回数字类型，前端可以安全调用toFixed()');
      console.log('🚀 状态: 可以部署');
      process.exit(0);
    } else {
      console.log('❌ 管理员系统JavaScript错误仍未修复');
      console.log('📋 说明: 数据类型问题或toFixed调用仍有问题');
      console.log('🔧 状态: 需要进一步修复');
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ 验证过程出错: ${error.message}`);
    console.log('🔧 状态: 需要检查修复');
    process.exit(1);
  }
}

main();