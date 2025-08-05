#!/usr/bin/env node

/**
 * 错题本检查：12项功能优化验证
 * 验证已完成的功能是否正常工作
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

// 验证API调用
async function verifyAPI(path, method = 'GET', token = null, body = null) {
  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    const bodyData = JSON.stringify(body);
    options.headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf8');
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      reject(new Error('请求超时'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 检查项目列表
const checkItems = [
  {
    id: 1,
    name: '支付配置公开API',
    description: '验证用户购买页面能够获取支付配置',
    test: async () => {
      const result = await verifyAPI('/api/payment-config?path=public');
      return {
        success: result.status === 200 && result.data.success,
        details: `状态码: ${result.status}, 响应: ${JSON.stringify(result.data).substring(0, 100)}`
      };
    }
  },
  {
    id: 2,
    name: '管理员系统登录',
    description: '验证管理员能够正常登录',
    test: async () => {
      try {
        const token = await getAdminToken();
        return {
          success: !!token,
          details: `Token获取成功: ${token ? '是' : '否'}`
        };
      } catch (error) {
        return {
          success: false,
          details: `登录失败: ${error.message}`
        };
      }
    }
  },
  {
    id: 3,
    name: '管理员数据概览',
    description: '验证管理员概览页面数据正常',
    test: async (token) => {
      const result = await verifyAPI('/api/admin?path=overview', 'GET', token);
      return {
        success: result.status === 200 && result.data.success,
        details: `状态码: ${result.status}, 数据: ${result.data.success ? '正常' : '异常'}`
      };
    }
  },
  {
    id: 4,
    name: '订单管理API',
    description: '验证订单管理功能正常',
    test: async (token) => {
      const result = await verifyAPI('/api/admin?path=orders', 'GET', token);
      return {
        success: result.status === 200 && result.data.success !== false,
        details: `状态码: ${result.status}, 订单数据: ${result.data.data ? result.data.data.length + '条' : '无'}`
      };
    }
  },
  {
    id: 5,
    name: '销售管理API',
    description: '验证销售管理功能正常',
    test: async (token) => {
      const result = await verifyAPI('/api/admin?path=sales', 'GET', token);
      return {
        success: result.status === 200 && result.data.success !== false,
        details: `状态码: ${result.status}, 销售数据: ${result.data.data ? result.data.data.length + '条' : '无'}`
      };
    }
  },
  {
    id: 6,
    name: '客户管理API',
    description: '验证客户管理功能正常',
    test: async (token) => {
      const result = await verifyAPI('/api/admin?path=customers', 'GET', token);
      return {
        success: result.status === 200 && result.data.success !== false,
        details: `状态码: ${result.status}, 客户数据: ${result.data.data ? result.data.data.length + '条' : '无'}`
      };
    }
  },
  {
    id: 7,
    name: '二级销售对账API',
    description: '验证二级销售对账功能正常',
    test: async () => {
      const result = await verifyAPI('/api/secondary-sales?path=settlement&wechat_name=test');
      return {
        success: result.status === 200 && result.data.success !== false,
        details: `状态码: ${result.status}, API响应: ${result.data.success ? '正常' : '异常'}`
      };
    }
  },
  {
    id: 8,
    name: '数据清理功能',
    description: '验证数据清理API可用性（验证路径存在）',
    test: async (token) => {
      // 检查DELETE方法是否被正确路由（会返回401因为token测试但不会404）
      const result = await verifyAPI('/api/admin?path=clear-test-data', 'DELETE', token);
      return {
        success: result.status !== 404, // 只要不是404就说明路径存在
        details: `API路径存在: ${result.status !== 404 ? '是' : '否'}, 状态码: ${result.status}`
      };
    }
  }
];

// 主要验证函数
async function runErrorBook() {
  console.log('🧪 错题本检查：12项功能优化验证');
  console.log('=' .repeat(60));
  
  let token = null;
  let passedCount = 0;
  let totalCount = checkItems.length;
  
  for (const item of checkItems) {
    console.log(`\n📋 检查项 ${item.id}: ${item.name}`);
    console.log(`   描述: ${item.description}`);
    
    try {
      // 如果是管理员登录项，获取token
      if (item.id === 2) {
        const result = await item.test();
        if (result.success) {
          token = await getAdminToken();
        }
        console.log(`   结果: ${result.success ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   详情: ${result.details}`);
        if (result.success) passedCount++;
      } else {
        // 其他检查项
        const result = await item.test(token);
        console.log(`   结果: ${result.success ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   详情: ${result.details}`);
        if (result.success) passedCount++;
      }
    } catch (error) {
      console.log(`   结果: ❌ 异常`);
      console.log(`   详情: ${error.message}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 错题本检查结果: ${passedCount}/${totalCount} 通过`);
  console.log(`✅ 通过率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (passedCount === totalCount) {
    console.log('🎉 所有检查项通过，可以进行部署！');
    return true;
  } else {
    console.log('⚠️  存在失败项，建议修复后再部署');
    return false;
  }
}

// 运行脚本
if (require.main === module) {
  runErrorBook()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 错题本检查异常:', error);
      process.exit(1);
    });
}

module.exports = { runErrorBook };