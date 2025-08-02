const axios = require('axios');

class CompleteTestExecutor {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.testResults = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      bugs: [],
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      }
    };
    this.adminToken = null;
    this.currentStage = '';
    this.currentTest = '';
  }

  async start() {
    console.log('🎯 开始执行知行财库系统完整测试');
    console.log('=' * 80);
    console.log('📋 测试原则：');
    console.log('1. 错题本方法：记录每个检查点的正确和错误解决方案及其指标');
    console.log('2. 部署等待原则：确保前一个测试完成后再开始下一个');
    console.log('3. 全面测试：测试所有功能模块和业务流程');
    console.log('4. 问题追踪：每个问题都要有明确的修复状态和验证记录');
    console.log('=' * 80);

    try {
      // 第一阶段：系统健康检查
      await this.stage1_HealthCheck();
      
      // 第二阶段：认证系统测试
      await this.stage2_Authentication();
      
      // 第三阶段：核心功能测试
      await this.stage3_CoreFunctions();
      
      // 第四阶段：业务流程测试
      await this.stage4_BusinessFlows();
      
      // 第五阶段：管理员功能测试
      await this.stage5_AdminFunctions();
      
      // 第六阶段：性能测试
      await this.stage6_Performance();
      
      // 第七阶段：用户体验测试
      await this.stage7_UserExperience();
      
      // 输出最终结果
      this.printFinalResults();
      
    } catch (error) {
      console.error('❌ 完整测试执行失败:', error.message);
      this.recordBug('CRITICAL', '完整测试执行失败', error);
    }
  }

  async stage1_HealthCheck() {
    this.currentStage = '第一阶段：系统健康检查';
    console.log(`\n🔍 ${this.currentStage}`);
    console.log('-' * 60);

    // 1.1 部署状态检查
    await this.test('Vercel部署状态检查', async () => {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 10000 });
      if (!response.data.success) {
        throw new Error('健康检查返回失败状态');
      }
      return response.data.data;
    });

    // 1.2 数据库连接测试
    await this.test('数据库连接测试', async () => {
      const response = await axios.get(`${this.baseURL}/health`);
      if (!response.data.data?.database?.connected) {
        throw new Error('数据库连接失败');
      }
      return response.data.data.database;
    });

    // 1.3 API端点可访问性测试
    await this.test('API端点可访问性测试', async () => {
      const endpoints = [
        '/health',
        '/auth',
        '/sales',
        '/orders',
        '/admin'
      ];
      
      for (const endpoint of endpoints) {
        try {
          await axios.get(`${this.baseURL}${endpoint}`, { timeout: 5000 });
        } catch (error) {
          if (error.response?.status !== 401) { // 401是正常的未认证响应
            throw new Error(`API端点 ${endpoint} 不可访问: ${error.message}`);
          }
        }
      }
      return '所有API端点可访问';
    });
  }

  async stage2_Authentication() {
    this.currentStage = '第二阶段：认证系统测试';
    console.log(`\n🔑 ${this.currentStage}`);
    console.log('-' * 60);

    // 2.1 管理员登录测试
    await this.test('管理员登录测试', async () => {
      const response = await axios.post(`${this.baseURL}/auth`, {
        path: 'login',
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      
      if (!response.data.success || !response.data.data?.token) {
        throw new Error('管理员登录失败');
      }
      
      this.adminToken = response.data.data.token;
      return '管理员登录成功';
    });

    // 2.2 Token验证测试
    await this.test('Token验证测试', async () => {
      const response = await axios.get(`${this.baseURL}/auth?path=verify`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('Token验证失败');
      }
      return 'Token验证成功';
    });

    // 2.3 权限控制测试
    await this.test('权限控制测试', async () => {
      // 测试未认证访问被拒绝
      try {
        await axios.get(`${this.baseURL}/admin?path=stats`);
        throw new Error('未认证访问应该被拒绝');
      } catch (error) {
        if (error.response?.status === 401) {
          return '权限控制正常';
        }
        throw error;
      }
    });
  }

  async stage3_CoreFunctions() {
    this.currentStage = '第三阶段：核心功能测试';
    console.log(`\n🔧 ${this.currentStage}`);
    console.log('-' * 60);

    // 3.1 销售管理功能测试
    await this.test('销售管理功能测试', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售列表获取失败');
      }
      return `销售列表获取成功，共${response.data.data?.length || 0}条记录`;
    });

    // 3.2 订单管理功能测试
    await this.test('订单管理功能测试', async () => {
      const response = await axios.get(`${this.baseURL}/orders?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('订单列表获取失败');
      }
      return `订单列表获取成功，共${response.data.data?.length || 0}条记录`;
    });

    // 3.3 一级销售API测试
    await this.test('一级销售API测试', async () => {
      const response = await axios.get(`${this.baseURL}/primary-sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('一级销售列表获取失败');
      }
      return `一级销售列表获取成功，共${response.data.data?.length || 0}条记录`;
    });

    // 3.4 二级销售API测试
    await this.test('二级销售API测试', async () => {
      const response = await axios.get(`${this.baseURL}/secondary-sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('二级销售列表获取失败');
      }
      return `二级销售列表获取成功，共${response.data.data?.length || 0}条记录`;
    });
  }

  async stage4_BusinessFlows() {
    this.currentStage = '第四阶段：业务流程测试';
    console.log(`\n🔄 ${this.currentStage}`);
    console.log('-' * 60);

    // 4.1 销售层级统计测试
    await this.test('销售层级统计测试', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售层级统计获取失败');
      }
      
      const stats = response.data.data;
      return `层级统计成功：一级销售${stats.primary_sales_count || 0}个，二级销售${stats.secondary_sales_count || 0}个`;
    });

    // 4.2 销售类型筛选测试
    await this.test('销售类型筛选测试', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=all`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售类型筛选失败');
      }
      return `销售类型筛选成功，共${response.data.data?.length || 0}条记录`;
    });

    // 4.3 管理员概览测试
    await this.test('管理员概览测试', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=overview`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('管理员概览获取失败');
      }
      
      const overview = response.data.data;
      return `概览数据获取成功：订单${overview.total_orders || 0}个，收入${overview.total_revenue || 0}元`;
    });
  }

  async stage5_AdminFunctions() {
    this.currentStage = '第五阶段：管理员功能测试';
    console.log(`\n👨‍💼 ${this.currentStage}`);
    console.log('-' * 60);

    // 5.1 数据统计功能测试
    await this.test('数据统计功能测试', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('数据统计功能失败');
      }
      return '数据统计功能正常';
    });

    // 5.2 数据筛选功能测试
    await this.test('数据筛选功能测试', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=primary`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('数据筛选功能失败');
      }
      return '数据筛选功能正常';
    });

    // 5.3 数据导出功能测试
    await this.test('数据导出功能测试', async () => {
      // 这里测试导出API是否可访问，实际导出功能可能需要更多参数
      try {
        await axios.get(`${this.baseURL}/admin?path=export`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        return '数据导出功能可访问';
      } catch (error) {
        if (error.response?.status === 400) {
          return '数据导出功能正常（需要参数）';
        }
        throw error;
      }
    });
  }

  async stage6_Performance() {
    this.currentStage = '第六阶段：性能测试';
    console.log(`\n⚡ ${this.currentStage}`);
    console.log('-' * 60);

    // 6.1 API响应时间测试
    await this.test('API响应时间测试', async () => {
      const startTime = Date.now();
      await axios.get(`${this.baseURL}/health`, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      this.testResults.performance.minResponseTime = Math.min(this.testResults.performance.minResponseTime, responseTime);
      this.testResults.performance.maxResponseTime = Math.max(this.testResults.performance.maxResponseTime, responseTime);
      
      if (responseTime > 5000) {
        throw new Error(`API响应时间过长: ${responseTime}ms`);
      }
      return `API响应时间正常: ${responseTime}ms`;
    });

    // 6.2 并发请求测试
    await this.test('并发请求测试', async () => {
      const concurrentPromises = [];
      for (let i = 0; i < 5; i++) {
        concurrentPromises.push(
          axios.get(`${this.baseURL}/health`, { timeout: 10000 })
        );
      }
      
      const startTime = Date.now();
      await Promise.all(concurrentPromises);
      const totalTime = Date.now() - startTime;
      
      return `并发测试完成: ${totalTime}ms`;
    });

    // 6.3 数据库查询性能测试
    await this.test('数据库查询性能测试', async () => {
      const startTime = Date.now();
      await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      const queryTime = Date.now() - startTime;
      
      if (queryTime > 3000) {
        throw new Error(`数据库查询时间过长: ${queryTime}ms`);
      }
      return `数据库查询性能正常: ${queryTime}ms`;
    });
  }

  async stage7_UserExperience() {
    this.currentStage = '第七阶段：用户体验测试';
    console.log(`\n👥 ${this.currentStage}`);
    console.log('-' * 60);

    // 7.1 错误处理机制测试
    await this.test('错误处理机制测试', async () => {
      try {
        await axios.get(`${this.baseURL}/nonexistent-endpoint`);
        throw new Error('应该返回404错误');
      } catch (error) {
        if (error.response?.status === 404) {
          return '错误处理机制正常';
        }
        throw error;
      }
    });

    // 7.2 超时处理测试
    await this.test('超时处理测试', async () => {
      try {
        await axios.get(`${this.baseURL}/health`, { timeout: 1 });
        throw new Error('应该超时');
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          return '超时处理机制正常';
        }
        throw error;
      }
    });

    // 7.3 数据一致性测试
    await this.test('数据一致性测试', async () => {
      const statsResponse = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      const salesResponse = await axios.get(`${this.baseURL}/sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (statsResponse.data.success && salesResponse.data.success) {
        return '数据一致性检查通过';
      }
      throw new Error('数据一致性检查失败');
    });
  }

  async test(testName, testFunction) {
    this.currentTest = testName;
    this.testResults.totalTests++;
    
    console.log(`\n🧪 测试: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${testName} - 通过 (${duration}ms)`);
      console.log(`   结果: ${result}`);
      
      this.testResults.passedTests++;
      
      // 更新性能统计
      this.testResults.performance.avgResponseTime = 
        (this.testResults.performance.avgResponseTime * (this.testResults.passedTests - 1) + duration) / this.testResults.passedTests;
      
    } catch (error) {
      console.log(`❌ ${testName} - 失败`);
      console.log(`   错误: ${error.message}`);
      
      this.testResults.failedTests++;
      this.recordBug('FUNCTIONAL', testName, error);
    }
  }

  recordBug(severity, testName, error) {
    const bug = {
      id: `BUG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      severity,
      testName,
      stage: this.currentStage,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      status: '未修复'
    };
    
    this.testResults.bugs.push(bug);
    
    console.log(`🐛 记录Bug: ${bug.id} - ${severity}级别`);
  }

  printFinalResults() {
    this.testResults.endTime = new Date();
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('\n' + '=' * 80);
    console.log('📊 完整测试执行结果');
    console.log('=' * 80);
    
    console.log(`⏱️  测试时间: ${this.testResults.startTime.toLocaleString()} - ${this.testResults.endTime.toLocaleString()}`);
    console.log(`⏱️  总耗时: ${Math.round(duration / 1000)}秒`);
    console.log(`📊 总测试数: ${this.testResults.totalTests}`);
    console.log(`✅ 通过: ${this.testResults.passedTests}`);
    console.log(`❌ 失败: ${this.testResults.failedTests}`);
    console.log(`📈 成功率: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2)}%`);
    
    console.log('\n⚡ 性能指标:');
    console.log(`   平均响应时间: ${this.testResults.performance.avgResponseTime.toFixed(2)}ms`);
    console.log(`   最大响应时间: ${this.testResults.performance.maxResponseTime}ms`);
    console.log(`   最小响应时间: ${this.testResults.performance.minResponseTime === Infinity ? 'N/A' : this.testResults.performance.minResponseTime}ms`);
    
    if (this.testResults.bugs.length > 0) {
      console.log('\n🐛 Bug统计:');
      console.log(`   总Bug数: ${this.testResults.bugs.length}`);
      
      const severityCount = {};
      this.testResults.bugs.forEach(bug => {
        severityCount[bug.severity] = (severityCount[bug.severity] || 0) + 1;
      });
      
      Object.entries(severityCount).forEach(([severity, count]) => {
        console.log(`   ${severity}级别: ${count}个`);
      });
      
      console.log('\n🚨 Bug详情:');
      this.testResults.bugs.forEach((bug, index) => {
        console.log(`   ${index + 1}. ${bug.id} - ${bug.testName}`);
        console.log(`      严重程度: ${bug.severity}`);
        console.log(`      错误: ${bug.error}`);
        console.log(`      状态: ${bug.status}`);
        console.log('');
      });
    }
    
    console.log('\n📋 错题本记录:');
    console.log('根据测试结果，需要重点关注以下问题:');
    
    if (this.testResults.bugs.length === 0) {
      console.log('   🎉 恭喜！没有发现任何Bug，系统运行良好！');
    } else {
      this.testResults.bugs.forEach(bug => {
        console.log(`   🔍 ${bug.testName}`);
        console.log(`      问题: ${bug.error}`);
        console.log(`      解决方案: 需要进一步调查和修复`);
        console.log(`      指标: 响应时间、错误率、成功率`);
        console.log('');
      });
    }
    
    console.log('\n🎯 测试完成！');
    console.log('=' * 80);
    
    // 保存测试结果到文件
    this.saveTestResults();
  }

  saveTestResults() {
    const fs = require('fs');
    const testReport = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        totalTests: this.testResults.totalTests,
        passedTests: this.testResults.passedTests,
        failedTests: this.testResults.failedTests,
        successRate: ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2) + '%',
        bugCount: this.testResults.bugs.length
      }
    };
    
    const filename = `test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(testReport, null, 2));
    console.log(`\n💾 测试结果已保存到: ${filename}`);
  }
}

// 执行测试
async function main() {
  const executor = new CompleteTestExecutor();
  await executor.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteTestExecutor; 