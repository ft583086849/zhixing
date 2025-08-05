#!/usr/bin/env node

/**
 * 验证一级分销商移除功能 - 部署效果检查
 * 
 * 检查项目：
 * 1. Vercel部署状态
 * 2. API健康检查
 * 3. 移除功能API端点测试
 * 4. 前端页面访问测试
 * 5. 错误处理验证
 */

const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  baseUrl: 'https://zhixing-seven.vercel.app',
  apiUrl: 'https://zhixing-seven.vercel.app/api',
  timeout: 10000
};

// HTTP请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Deployment-Verification-Bot/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// 验证步骤
const verificationSteps = [
  {
    id: 'step_1',
    title: '健康检查 - API基础连通性',
    description: '验证API服务器基本可访问性',
    test: async () => {
      const response = await makeRequest(`${CONFIG.apiUrl}/health`);
      return {
        success: response.status === 200,
        data: { status: response.status, response: response.data },
        message: response.status === 200 ? 'API服务器正常' : `API响应异常: ${response.status}`
      };
    }
  },
  {
    id: 'step_2', 
    title: '端点检查 - 移除二级销售API路由',
    description: '验证PUT /api/sales?path=remove-secondary路由存在',
    test: async () => {
      try {
        // 发送一个无效的请求来检查路由是否存在
        const response = await makeRequest(`${CONFIG.apiUrl}/sales?path=remove-secondary&id=test`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: { reason: 'test' }
        });
        
        // 我们期望401（未授权）而不是404（路由不存在）
        const routeExists = response.status !== 404;
        return {
          success: routeExists,
          data: { status: response.status, response: response.data },
          message: routeExists ? '移除API路由已部署' : '移除API路由不存在（404）'
        };
      } catch (error) {
        return {
          success: false,
          data: { error: error.message },
          message: `请求失败: ${error.message}`
        };
      }
    }
  },
  {
    id: 'step_3',
    title: '方法支持 - PUT方法CORS验证',
    description: '验证API支持PUT方法的CORS配置',
    test: async () => {
      try {
        const response = await makeRequest(`${CONFIG.apiUrl}/sales`, {
          method: 'OPTIONS'
        });
        
        const allowedMethods = response.headers['access-control-allow-methods'] || '';
        const supportsPUT = allowedMethods.includes('PUT');
        
        return {
          success: supportsPUT,
          data: { 
            status: response.status, 
            allowedMethods: allowedMethods
          },
          message: supportsPUT ? 'PUT方法CORS支持已配置' : `PUT方法不支持，当前方法: ${allowedMethods}`
        };
      } catch (error) {
        return {
          success: false,
          data: { error: error.message },
          message: `CORS检查失败: ${error.message}`
        };
      }
    }
  },
  {
    id: 'step_4',
    title: '前端页面 - 一级销售对账页面',
    description: '验证前端页面可以正常访问',
    test: async () => {
      try {
        const response = await makeRequest(`${CONFIG.baseUrl}/sales/commission`);
        const pageLoaded = response.status === 200;
        
        return {
          success: pageLoaded,
          data: { status: response.status },
          message: pageLoaded ? '一级销售对账页面正常访问' : `页面访问失败: ${response.status}`
        };
      } catch (error) {
        return {
          success: false,
          data: { error: error.message },
          message: `页面访问失败: ${error.message}`
        };
      }
    }
  },
  {
    id: 'step_5',
    title: '错误处理 - 未授权访问验证',
    description: '验证移除API正确处理未授权请求',
    test: async () => {
      try {
        const response = await makeRequest(`${CONFIG.apiUrl}/sales?path=remove-secondary&id=123`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: { reason: '测试移除' }
        });
        
        // 应该返回401未授权，不是500或404
        const correctErrorHandling = response.status === 401;
        
        return {
          success: correctErrorHandling,
          data: { status: response.status, response: response.data },
          message: correctErrorHandling ? 
            '权限验证正常工作' : 
            `权限验证异常，期望401，实际${response.status}`
        };
      } catch (error) {
        return {
          success: false,
          data: { error: error.message },
          message: `权限验证测试失败: ${error.message}`
        };
      }
    }
  }
];

// 执行验证
async function runVerification() {
  console.log('🔍 开始验证一级分销商移除功能部署效果');
  console.log('='.repeat(60));
  console.log(`🌐 目标环境: ${CONFIG.baseUrl}`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  let successCount = 0;
  const results = [];

  for (const step of verificationSteps) {
    console.log(`\n📋 ${step.id}: ${step.title}`);
    console.log(`🎯 ${step.description}`);
    
    try {
      console.log('🔄 执行中...');
      const result = await step.test();
      
      if (result.success) {
        console.log(`✅ 成功: ${result.message}`);
        successCount++;
      } else {
        console.log(`❌ 失败: ${result.message}`);
      }
      
      if (result.data) {
        console.log(`📊 数据: ${JSON.stringify(result.data, null, 2)}`);
      }
      
      results.push({
        ...step,
        result: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
      results.push({
        ...step,
        result: {
          success: false,
          error: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果汇总');
  console.log('='.repeat(60));
  
  const totalSteps = verificationSteps.length;
  const failedCount = totalSteps - successCount;
  const successRate = ((successCount / totalSteps) * 100).toFixed(1);
  
  console.log(`✅ 成功: ${successCount}/${totalSteps}`);
  console.log(`❌ 失败: ${failedCount}/${totalSteps}`);
  console.log(`📈 成功率: ${successRate}%`);
  
  if (successCount === totalSteps) {
    console.log('\n🎉 部署验证完全成功！');
    console.log('🚀 一级分销商移除功能已正常部署');
  } else {
    console.log('\n⚠️  部署验证发现问题:');
    results.filter(r => !r.result.success).forEach(result => {
      console.log(`   ❌ ${result.id}: ${result.result.message || result.result.error}`);
    });
  }

  // 保存报告
  const reportPath = `部署验证报告_一级分销商移除功能_${Date.now()}.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: CONFIG.baseUrl,
    summary: {
      total: totalSteps,
      success: successCount,
      failed: failedCount,
      successRate: successRate + '%'
    },
    results: results
  }, null, 2));
  
  console.log(`\n📄 详细报告已保存: ${reportPath}`);
  
  return successCount === totalSteps;
}

// 运行验证
runVerification()
  .then(success => {
    console.log(`\n🏁 验证${success ? '成功' : '失败'}完成`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 验证过程异常:', error);
    process.exit(1);
  });