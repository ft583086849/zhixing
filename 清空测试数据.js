#!/usr/bin/env node

/**
 * 清空数据库所有测试数据脚本
 * 用途：清理现有的测试数据，为新的标准测试数据做准备
 */

const https = require('https');

// 管理员登录获取token
async function getAdminToken() {
  const credentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };
  const loginData = JSON.stringify(credentials);

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/auth?path=login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData, 'utf8')
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.data && result.data.token) {
            resolve(result.data.token);
          } else {
            reject(new Error(`登录失败: ${result.message || '未知错误'}`));
          }
        } catch (e) {
          reject(new Error(`JSON解析错误: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// 调用数据库清理API
async function clearDatabaseData(token) {
  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/admin?path=clear-test-data',
    method: 'DELETE',
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
          reject(new Error(`JSON解析错误: ${e.message}, 响应: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      reject(new Error('请求超时'));
    });
    req.end();
  });
}

// 主函数
async function clearTestData() {
  console.log('🧹 开始清空数据库测试数据...\n');

  try {
    // 步骤1: 获取管理员token
    console.log('🔐 步骤1: 获取管理员token...');
    const token = await getAdminToken();
    console.log('   ✅ 管理员登录成功\n');

    // 步骤2: 执行数据清理
    console.log('🗑️  步骤2: 执行数据清理...');
    const result = await clearDatabaseData(token);
    
    if (result.success) {
      console.log('   ✅ 数据清理成功');
      console.log(`   📊 清理结果: ${result.message || '所有测试数据已清空'}`);
      
      if (result.data && result.data.clearedTables) {
        console.log('   📋 清理的表:');
        result.data.clearedTables.forEach(table => {
          console.log(`      - ${table.name}: ${table.count} 条记录`);
        });
      }
    } else {
      console.log(`   ❌ 数据清理失败: ${result.message}`);
    }

  } catch (error) {
    console.error('❌ 清理过程出错:', error.message);
    process.exit(1);
  }

  console.log('\n🎯 数据清理完成！');
  console.log('💡 提示: 现在可以运行创建测试数据脚本来生成新的标准测试数据');
}

// 运行脚本
if (require.main === module) {
  clearTestData().catch(console.error);
}

module.exports = { clearTestData };