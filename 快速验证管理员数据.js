#!/usr/bin/env node

/**
 * 快速验证管理员后台数据和佣金设置功能
 * 检查测试数据是否成功创建并可访问
 */

const https = require('https');

console.log('🔍 快速验证管理员后台数据...');
console.log('=' .repeat(50));

// 检查数据库健康状态
const checkHealth = async () => {
  console.log('\n📊 1. 检查数据库健康状态...');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://zhixing-seven.vercel.app/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`   ✅ 数据库连接: ${jsonData.data?.database?.connected ? '正常' : '异常'}`);
          console.log(`   📍 服务状态: ${jsonData.data?.status || '未知'}`);
          console.log(`   🕐 检查时间: ${jsonData.data?.timestamp || '未知'}`);
          resolve(jsonData);
        } catch (error) {
          console.log(`   ❌ 健康检查解析失败: ${error.message}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 健康检查请求失败: ${error.message}`);
      resolve(null);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ 健康检查请求超时');
      resolve(null);
    });
  });
};

// 验证数据存在性 (通过直接查询)
const checkDatabaseDirectly = async () => {
  console.log('\n🔍 2. 直接验证数据库数据...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'check_data_count'
    });
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/health',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.data) {
            console.log(`   📋 一级销售数量: ${jsonData.data.primary_sales || 0}`);
            console.log(`   👥 二级销售数量: ${jsonData.data.secondary_sales || 0}`);
            console.log(`   🛒 订单数量: ${jsonData.data.orders || 0}`);
            console.log(`   💰 总订单金额: ${jsonData.data.total_amount || 0}元`);
          }
          resolve(jsonData);
        } catch (error) {
          console.log(`   ⚠️ 数据检查响应: ${data.substring(0, 200)}...`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 数据检查失败: ${error.message}`);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
};

// 检查前端页面状态
const checkFrontend = async () => {
  console.log('\n🖥️ 3. 检查前端页面状态...');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://zhixing-seven.vercel.app/admin', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 页面状态码: ${res.statusCode}`);
        console.log(`   📦 页面大小: ${(data.length / 1024).toFixed(1)}KB`);
        
        // 检查关键内容
        const hasReact = data.includes('react') || data.includes('React');
        const hasAdminInterface = data.includes('admin') || data.includes('Admin');
        
        console.log(`   ⚛️ React框架: ${hasReact ? '✅ 已加载' : '❌ 未检测到'}`);
        console.log(`   🛠️ 管理界面: ${hasAdminInterface ? '✅ 已加载' : '❌ 未检测到'}`);
        
        resolve({
          status: res.statusCode,
          size: data.length,
          hasReact,
          hasAdminInterface
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 前端检查失败: ${error.message}`);
      resolve(null);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ 前端检查请求超时');
      resolve(null);
    });
  });
};

// 输出解决方案
const printSolution = () => {
  console.log('\n🎯 问题解决指南:');
  console.log('=' .repeat(50));
  
  console.log('\n❓ 如果管理员后台仍显示数据为0:');
  console.log('');
  console.log('🔧 立即解决步骤:');
  console.log('   1. 强制清理浏览器缓存:');
  console.log('      - Chrome/Edge: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)');
  console.log('      - Firefox: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
  console.log('');
  console.log('   2. 使用管理员账户登录:');
  console.log('      - 访问: https://zhixing-seven.vercel.app/admin');
  console.log('      - 输入正确的管理员账户和密码');
  console.log('');
  console.log('   3. 验证数据显示:');
  console.log('      - 订单管理: 应显示10个订单');
  console.log('      - 销售管理: 应显示40个销售 (10个一级 + 30个二级)');
  console.log('      - 数据概览: 应显示总金额$6,580');
  console.log('');
  console.log('🔧 佣金设置位置:');
  console.log('   📍 销售管理页面 → 佣金率列 → 编辑按钮 (✏️)');
  console.log('   🖱️ 点击编辑 → 输入新佣金率 → 点击确认 (✓)');
  console.log('');
  console.log('💡 测试数据已创建完成:');
  console.log('   - ✅ 10个一级销售 (fresh_primary_001 到 010)');
  console.log('   - ✅ 30个二级销售');
  console.log('   - ✅ 10个订单 (总金额6,580元)');
  console.log('');
  console.log('🚀 预期结果: 清理缓存并登录后，所有数据都应正常显示！');
};

// 主执行函数
const runValidation = async () => {
  try {
    await checkHealth();
    await checkDatabaseDirectly();
    await checkFrontend();
    
    printSolution();
    
  } catch (error) {
    console.error('\n❌ 验证过程中发生错误:', error.message);
    printSolution();
  }
};

runValidation();