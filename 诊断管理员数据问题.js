#!/usr/bin/env node

/**
 * 诊断管理员后台数据为0的问题
 * 检查数据库状态和佣金设置功能
 */

const https = require('https');

console.log('🔍 诊断管理员后台数据问题...');
console.log('=' .repeat(50));

// 检查API响应
const checkAPI = async (path, description) => {
  const url = `https://zhixing-seven.vercel.app/api/admin?path=${path}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
};

// 检查数据库健康状态
const checkDBHealth = async () => {
  const url = 'https://zhixing-seven.vercel.app/api/health';
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
};

const runDiagnosis = async () => {
  console.log('\n📊 1. 检查数据库健康状态...');
  try {
    const healthResult = await checkDBHealth();
    console.log(`   状态码: ${healthResult.status}`);
    if (healthResult.data) {
      console.log(`   响应数据:`, JSON.stringify(healthResult.data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ 健康检查失败: ${error.message}`);
  }

  console.log('\n📋 2. 检查订单数据API...');
  try {
    const ordersResult = await checkAPI('orders', '订单管理');
    console.log(`   状态码: ${ordersResult.status}`);
    if (ordersResult.data) {
      if (ordersResult.data.success) {
        console.log(`   ✅ 订单数据: ${ordersResult.data.data ? ordersResult.data.data.length : 0} 条记录`);
        if (ordersResult.data.data && ordersResult.data.data.length > 0) {
          console.log(`   📝 示例订单:`, JSON.stringify(ordersResult.data.data[0], null, 2));
        }
      } else {
        console.log(`   ❌ API错误: ${ordersResult.data.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ 订单API检查失败: ${error.message}`);
  }

  console.log('\n👥 3. 检查销售数据API...');
  try {
    const salesResult = await checkAPI('sales', '销售管理');
    console.log(`   状态码: ${salesResult.status}`);
    if (salesResult.data) {
      if (salesResult.data.success) {
        console.log(`   ✅ 销售数据: ${salesResult.data.data ? salesResult.data.data.length : 0} 条记录`);
        if (salesResult.data.data && salesResult.data.data.length > 0) {
          console.log(`   📝 示例销售:`, JSON.stringify(salesResult.data.data[0], null, 2));
        }
      } else {
        console.log(`   ❌ API错误: ${salesResult.data.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ 销售API检查失败: ${error.message}`);
  }

  console.log('\n📈 4. 检查统计数据API...');
  try {
    const statsResult = await checkAPI('stats', '数据概览');
    console.log(`   状态码: ${statsResult.status}`);
    if (statsResult.data) {
      if (statsResult.data.success) {
        console.log(`   ✅ 统计数据:`, JSON.stringify(statsResult.data.data, null, 2));
      } else {
        console.log(`   ❌ API错误: ${statsResult.data.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ 统计API检查失败: ${error.message}`);
  }

  console.log('\n🔧 5. 检查佣金设置功能...');
  // 这里需要模拟一个POST请求测试佣金修改API
  console.log('   💡 佣金设置功能需要登录后通过前端界面操作');
  console.log('   📍 位置: 销售管理页面 -> 每行的"操作"列 -> 修改佣金按钮');
  
  console.log('\n🔍 诊断总结:');
  console.log('   如果所有API都返回空数据，可能的原因:');
  console.log('   1. 数据库中确实没有数据 (需要创建测试数据)');
  console.log('   2. 数据库连接或查询问题');
  console.log('   3. 前端缓存问题 (需要清理缓存)');
  console.log('   4. API认证问题 (需要管理员登录)');
};

runDiagnosis().catch(error => {
  console.error('\n❌ 诊断过程中发生错误:', error.message);
});