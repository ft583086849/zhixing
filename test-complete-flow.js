const axios = require('axios');

class CompleteFlowTester {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.adminToken = null;
  }

  async start() {
    console.log('🎯 开始完整流程测试 - 遵循错题本方法');
    console.log('=' * 60);
    console.log('📋 测试原则：');
    console.log('1. 错题本方法：记录每个检查点的正确和错误解决方案');
    console.log('2. 部署等待原则：确保前一个测试完成后再开始下一个');
    console.log('3. 全面测试：测试所有功能模块和业务流程');
    console.log('=' * 60);

    try {
      // 第一阶段：基础健康检查
      await this.testHealthCheck();
      
      // 第二阶段：认证系统测试
      await this.testAuthentication();
      
      // 第三阶段：数据库连接测试
      await this.testDatabaseConnection();
      
      // 第四阶段：核心API功能测试
      await this.testCoreAPIs();
      
      // 第五阶段：业务流程测试
      await this.testBusinessFlows();
      
      // 第六阶段：管理员功能测试
      await this.testAdminFunctions();
      
      // 第七阶段：性能测试
      await this.testPerformance();
      
      // 输出最终结果
      this.printFinalResults();
      
    } catch (error) {
      console.error('❌ 完整流程测试失败:', error.message);
      this.recordError('完整流程测试', error);
    }
  }

  async testHealthCheck() {
    console.log('\n🔍 第一阶段：基础健康检查');
    console.log('-' * 40);
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        this.logSuccess('健康检查API正常');
        console.log('📊 响应数据:', JSON.stringify(response.data.data, null, 2));
      } else {
        throw new Error('健康检查返回失败状态');
      }
    } catch (error) {
      this.logError('健康检查失败', error);
      throw error;
    }
  }

  async testAuthentication() {
    console.log('\n🔑 第二阶段：认证系统测试');
    console.log('-' * 40);
    
    try {
      // 测试管理员登录
      const loginResponse = await axios.post(`${this.baseURL}/auth`, {
        path: 'login',
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      
      if (loginResponse.data.success && loginResponse.data.data?.token) {
        this.adminToken = loginResponse.data.data.token;
        this.logSuccess('管理员登录成功');
        console.log('📊 Token获取成功');
      } else {
        throw new Error('登录失败，未获取到token');
      }
      
      // 测试token验证
      const verifyResponse = await axios.get(`${this.baseURL}/auth?path=verify`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });
      
      if (verifyResponse.data.success) {
        this.logSuccess('Token验证成功');
      } else {
        throw new Error('Token验证失败');
      }
      
    } catch (error) {
      this.logError('认证系统测试失败', error);
      throw error;
    }
  }

  async testDatabaseConnection() {
    console.log('\n🗄️ 第三阶段：数据库连接测试');
    console.log('-' * 40);
    
    try {
      // 测试数据库连接状态
      const healthResponse = await axios.get(`${this.baseURL}/health`);
      
      if (healthResponse.data.data?.database?.connected) {
        this.logSuccess('数据库连接正常');
        console.log('📊 数据库状态:', healthResponse.data.data.database);
      } else {
        throw new Error('数据库连接失败');
      }
      
    } catch (error) {
      this.logError('数据库连接测试失败', error);
      throw error;
    }
  }

  async testCoreAPIs() {
    console.log('\n🔧 第四阶段：核心API功能测试');
    console.log('-' * 40);
    
    const apis = [
      { name: '销售API', path: '/sales?path=list' },
      { name: '订单API', path: '/orders?path=list' },
      { name: '管理员统计API', path: '/admin?path=stats' },
      { name: '一级销售API', path: '/primary-sales?path=list' },
      { name: '二级销售API', path: '/secondary-sales?path=list' }
    ];
    
    for (const api of apis) {
      try {
        const response = await axios.get(`${this.baseURL}${api.path}`, {
          headers: {
            'Authorization': `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        
        if (response.data.success) {
          this.logSuccess(`${api.name}测试成功`);
          console.log(`📊 ${api.name}数据条数: ${response.data.data?.length || 0}`);
        } else {
          throw new Error(`${api.name}返回失败状态`);
        }
      } catch (error) {
        this.logError(`${api.name}测试失败`, error);
      }
    }
  }

  async testBusinessFlows() {
    console.log('\n🔄 第五阶段：业务流程测试');
    console.log('-' * 40);
    
    try {
      // 测试销售层级统计
      const hierarchyResponse = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });
      
      if (hierarchyResponse.data.success) {
        this.logSuccess('销售层级统计测试成功');
        const stats = hierarchyResponse.data.data;
        console.log('📊 层级统计:');
        console.log(`  - 一级销售: ${stats.primary_sales_count || 0}`);
        console.log(`  - 二级销售: ${stats.secondary_sales_count || 0}`);
        console.log(`  - 活跃层级: ${stats.active_hierarchies || 0}`);
      }
      
      // 测试销售类型筛选
      const filterResponse = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=all`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });
      
      if (filterResponse.data.success) {
        this.logSuccess('销售类型筛选测试成功');
        console.log(`📊 筛选结果: ${filterResponse.data.data?.length || 0} 条记录`);
      }
      
    } catch (error) {
      this.logError('业务流程测试失败', error);
    }
  }

  async testAdminFunctions() {
    console.log('\n👨‍💼 第六阶段：管理员功能测试');
    console.log('-' * 40);
    
    try {
      // 测试管理员概览
      const overviewResponse = await axios.get(`${this.baseURL}/admin?path=overview`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });
      
      if (overviewResponse.data.success) {
        this.logSuccess('管理员概览测试成功');
        const overview = overviewResponse.data.data;
        console.log('📊 概览数据:');
        console.log(`  - 总订单: ${overview.total_orders || 0}`);
        console.log(`  - 总销售额: ${overview.total_revenue || 0}`);
        console.log(`  - 总佣金: ${overview.total_commission || 0}`);
      }
      
    } catch (error) {
      this.logError('管理员功能测试失败', error);
    }
  }

  async testPerformance() {
    console.log('\n⚡ 第七阶段：性能测试');
    console.log('-' * 40);
    
    try {
      const startTime = Date.now();
      
      // 测试API响应时间
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 5000) {
        this.logSuccess(`API响应时间正常: ${responseTime}ms`);
      } else {
        this.logError(`API响应时间过长: ${responseTime}ms`);
      }
      
      // 测试并发请求
      const concurrentPromises = [];
      for (let i = 0; i < 5; i++) {
        concurrentPromises.push(
          axios.get(`${this.baseURL}/health`, { timeout: 10000 })
        );
      }
      
      const concurrentStart = Date.now();
      await Promise.all(concurrentPromises);
      const concurrentTime = Date.now() - concurrentStart;
      
      this.logSuccess(`并发测试完成: ${concurrentTime}ms`);
      
    } catch (error) {
      this.logError('性能测试失败', error);
    }
  }

  logSuccess(message) {
    console.log(`✅ ${message}`);
    this.testResults.passed++;
    this.testResults.total++;
    this.testResults.details.push({
      type: 'success',
      message,
      timestamp: new Date().toISOString()
    });
  }

  logError(message, error = null) {
    console.log(`❌ ${message}`);
    if (error) {
      console.log(`   错误详情: ${error.message}`);
    }
    this.testResults.failed++;
    this.testResults.total++;
    this.testResults.details.push({
      type: 'error',
      message,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }

  recordError(context, error) {
    this.testResults.details.push({
      type: 'critical',
      context,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  printFinalResults() {
    console.log('\n' + '=' * 60);
    console.log('📊 完整流程测试结果');
    console.log('=' * 60);
    console.log(`✅ 通过: ${this.testResults.passed}`);
    console.log(`❌ 失败: ${this.testResults.failed}`);
    console.log(`📊 总计: ${this.testResults.total}`);
    console.log(`📈 成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n🚨 失败详情:');
      this.testResults.details
        .filter(detail => detail.type === 'error' || detail.type === 'critical')
        .forEach(detail => {
          console.log(`  - ${detail.message}`);
          if (detail.error) {
            console.log(`    错误: ${detail.error}`);
          }
        });
    }
    
    console.log('\n📋 错题本记录:');
    console.log('根据测试结果，需要重点关注以下问题:');
    this.testResults.details
      .filter(detail => detail.type === 'error' || detail.type === 'critical')
      .forEach(detail => {
        console.log(`  🔍 ${detail.message}`);
        console.log(`    解决方案: 需要进一步调查和修复`);
        console.log(`    指标: 响应时间、错误率、成功率`);
      });
    
    console.log('\n🎯 测试完成！');
  }
}

// 执行测试
async function main() {
  const tester = new CompleteFlowTester();
  await tester.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteFlowTester; 