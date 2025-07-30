#!/usr/bin/env node

// 🧪 数据库连接修复验证脚本
// 用于测试修复后的数据库连接是否正常工作

const https = require('https');

const VERCEL_URL = 'https://zhixing-zeta.vercel.app';

console.log('🧪 开始验证数据库连接修复...\n');

// 测试健康检查API
async function testHealthCheck() {
  console.log('📊 测试 1: 健康检查API');
  console.log('URL:', `${VERCEL_URL}/api/health`);
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/health`);
    const data = await response.json();
    
    console.log('✅ 健康检查响应:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.database) {
      if (data.database.connected) {
        console.log('🎉 数据库连接成功！');
      } else {
        console.log('❌ 数据库连接失败:');
        console.log('错误:', data.database.error);
      }
    }
    
    console.log('');
    return data;
  } catch (error) {
    console.error('❌ 健康检查请求失败:', error.message);
    console.log('');
    return null;
  }
}

// 测试环境变量调试API
async function testDebugEnv() {
  console.log('📋 测试 2: 环境变量调试API');
  console.log('URL:', `${VERCEL_URL}/api/debug-env`);
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/debug-env`);
    const data = await response.json();
    
    console.log('✅ 环境变量状态:');
    console.log(JSON.stringify(data, null, 2));
    
    const { computed } = data;
    if (computed) {
      console.log(`\n📊 检测结果:`);
      console.log(`- 数据库配置: ${computed.hasDbConfig ? '✅ 已配置' : '❌ 未配置'}`);
      console.log(`- 生产环境: ${computed.isProduction ? '✅ 是' : '❌ 否'}`);
      console.log(`- 当前系统: ${computed.currentSystem}`);
    }
    
    console.log('');
    return data;
  } catch (error) {
    console.error('❌ 环境变量调试请求失败:', error.message);
    console.log('');
    return null;
  }
}

// 分析结果并提供建议
function analyzeResults(healthData, debugData) {
  console.log('🔍 结果分析:\n');
  
  if (!healthData || !debugData) {
    console.log('❌ 无法获取完整的测试数据，请检查网络连接');
    return;
  }
  
  const hasDbConfig = debugData.computed?.hasDbConfig;
  const dbConnected = healthData.database?.connected;
  
  if (hasDbConfig && dbConnected) {
    console.log('🎉 恭喜！数据库连接修复成功！');
    console.log('✅ 环境变量配置正确');
    console.log('✅ 数据库连接正常');
    console.log('✅ 系统已统一使用 DB_* 变量');
  } else if (hasDbConfig && !dbConnected) {
    console.log('⚠️ 环境变量配置正确，但数据库连接仍有问题');
    console.log('可能原因:');
    console.log('1. PlanetScale数据库服务异常');
    console.log('2. 连接信息不正确'); 
    console.log('3. 网络连接问题');
    console.log('\n建议检查 PlanetScale 控制台状态');
  } else if (!hasDbConfig) {
    console.log('❌ 环境变量仍未正确配置');
    console.log('请确认Vercel环境变量中已设置:');
    console.log('- DB_HOST');
    console.log('- DB_USER'); 
    console.log('- DB_PASSWORD');
    console.log('- DB_NAME');
  } else {
    console.log('❓ 检测到异常状态，请联系技术支持');
  }
}

// 主测试函数
async function runTests() {
  try {
    const healthData = await testHealthCheck();
    const debugData = await testDebugEnv();
    
    analyzeResults(healthData, debugData);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
runTests();