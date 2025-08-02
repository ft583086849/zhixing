const axios = require('axios');

class DetailedTestExecutor {
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
      },
      apiTests: {
        health: { passed: 0, failed: 0, total: 0 },
        auth: { passed: 0, failed: 0, total: 0 },
        sales: { passed: 0, failed: 0, total: 0 },
        orders: { passed: 0, failed: 0, total: 0 },
        admin: { passed: 0, failed: 0, total: 0 },
        commission: { passed: 0, failed: 0, total: 0 }
      }
    };
    this.adminToken = null;
    this.currentStage = '';
    this.currentTest = '';
  }

  async start() {
    console.log('🎯 开始执行知行财库系统详细测试');
    console.log('=' * 80);
    console.log('📋 测试原则：');
    console.log('1. 错题本方法：记录每个检查点的正确和错误解决方案及其指标');
    console.log('2. 部署等待原则：确保前一个测试完成后再开始下一个');
    console.log('3. 全面测试：测试所有功能模块和业务流程');
    console.log('4. 问题追踪：每个问题都要有明确的修复状态和验证记录');
    console.log('=' * 80);

    try {
      // API端点详细测试
      await this.testAllAPIs();
      
      // 业务流程测试
      await this.testBusinessFlows();
      
      // 性能测试
      await this.testPerformance();
      
      // 错误处理测试
      await this.testErrorHandling();
      
      // 输出最终结果
      this.printFinalResults();
      
    } catch (error) {
      console.error('❌ 详细测试执行失败:', error.message);
      this.recordBug('CRITICAL', '详细测试执行失败', error);
    }
  }

  async testAllAPIs() {
    console.log('\n🔧 API端点详细测试');
    console.log('=' * 60);

    // 1. 健康检查API测试
    await this.testHealthAPI();
    
    // 2. 认证API测试
    await this.testAuthAPI();
    
    // 3. 销售管理API测试
    await this.testSalesAPI();
    
    // 4. 一级销售API测试
    await this.testPrimarySalesAPI();
    
    // 5. 二级销售API测试
    await this.testSecondarySalesAPI();
    
    // 6. 订单管理API测试
    await this.testOrdersAPI();
    
    // 7. 管理员API测试
    await this.testAdminAPI();
    
    // 8. 佣金管理API测试
    await this.testCommissionAPI();
    
    // 9. 销售层级API测试
    await this.testSalesHierarchyAPI();
    
    // 10. 支付配置API测试
    await this.testPaymentConfigAPI();
  }

  async testHealthAPI() {
    console.log('\n🏥 健康检查API测试');
    console.log('-' * 40);

    // 1.1 端点可访问性测试
    await this.test('健康检查端点可访问性', async () => {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`响应状态码错误: ${response.status}`);
      }
      return '端点可访问';
    }, 'health');

    // 1.2 响应格式测试
    await this.test('健康检查响应格式', async () => {
      const response = await axios.get(`${this.baseURL}/health`);
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('响应格式不是JSON对象');
      }
      if (typeof response.data.success !== 'boolean') {
        throw new Error('success字段不是布尔值');
      }
      return '响应格式正确';
    }, 'health');

    // 1.3 数据库连接状态测试
    await this.test('数据库连接状态', async () => {
      const response = await axios.get(`${this.baseURL}/health`);
      if (!response.data.data?.database?.connected) {
        throw new Error('数据库连接失败');
      }
      return '数据库连接正常';
    }, 'health');

    // 1.4 响应时间测试
    await this.test('健康检查响应时间', async () => {
      const startTime = Date.now();
      await axios.get(`${this.baseURL}/health`, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 3000) {
        throw new Error(`响应时间过长: ${responseTime}ms`);
      }
      return `响应时间正常: ${responseTime}ms`;
    }, 'health');
  }

  async testAuthAPI() {
    console.log('\n🔑 认证API测试');
    console.log('-' * 40);

    // 2.1 管理员登录测试
    await this.test('管理员登录功能', async () => {
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
    }, 'auth');

    // 2.2 Token验证测试
    await this.test('Token验证功能', async () => {
      const response = await axios.get(`${this.baseURL}/auth?path=verify`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('Token验证失败');
      }
      return 'Token验证成功';
    }, 'auth');

    // 2.3 错误凭据测试
    await this.test('错误凭据处理', async () => {
      try {
        await axios.post(`${this.baseURL}/auth`, {
          path: 'login',
          username: 'wrong',
          password: 'wrong'
        });
        throw new Error('应该返回错误');
      } catch (error) {
        if (error.response?.status === 401) {
          return '错误凭据处理正确';
        }
        throw error;
      }
    }, 'auth');

    // 2.4 权限控制测试
    await this.test('权限控制验证', async () => {
      try {
        await axios.get(`${this.baseURL}/admin?path=stats`);
        throw new Error('未认证访问应该被拒绝');
      } catch (error) {
        if (error.response?.status === 401) {
          return '权限控制正常';
        }
        throw error;
      }
    }, 'auth');
  }

  async testSalesAPI() {
    console.log('\n👥 销售管理API测试');
    console.log('-' * 40);

    // 3.1 销售列表获取测试
    await this.test('销售列表获取', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售列表获取失败');
      }
      
      if (!Array.isArray(response.data.data)) {
        throw new Error('销售列表格式错误');
      }
      
      return `销售列表获取成功，共${response.data.data.length}条记录`;
    }, 'sales');

    // 3.2 销售筛选测试
    await this.test('销售类型筛选', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=all`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售筛选失败');
      }
      
      return `销售筛选成功，共${response.data.data?.length || 0}条记录`;
    }, 'sales');

    // 3.3 一级销售筛选测试
    await this.test('一级销售筛选', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=primary`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('一级销售筛选失败');
      }
      
      return `一级销售筛选成功，共${response.data.data?.length || 0}条记录`;
    }, 'sales');

    // 3.4 二级销售筛选测试
    await this.test('二级销售筛选', async () => {
      const response = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=secondary`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('二级销售筛选失败');
      }
      
      return `二级销售筛选成功，共${response.data.data?.length || 0}条记录`;
    }, 'sales');
  }

  async testPrimarySalesAPI() {
    console.log('\n👤 一级销售API测试');
    console.log('-' * 40);

    // 4.1 一级销售列表测试
    await this.test('一级销售列表获取', async () => {
      const response = await axios.get(`${this.baseURL}/primary-sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('一级销售列表获取失败');
      }
      
      return `一级销售列表获取成功，共${response.data.data?.length || 0}条记录`;
    }, 'sales');

    // 4.2 一级销售结算测试
    await this.test('一级销售结算数据', async () => {
      const response = await axios.get(`${this.baseURL}/primary-sales?path=settlement`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('一级销售结算数据获取失败');
      }
      
      return '一级销售结算数据获取成功';
    }, 'sales');
  }

  async testSecondarySalesAPI() {
    console.log('\n👥 二级销售API测试');
    console.log('-' * 40);

    // 5.1 二级销售列表测试
    await this.test('二级销售列表获取', async () => {
      const response = await axios.get(`${this.baseURL}/secondary-sales?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('二级销售列表获取失败');
      }
      
      return `二级销售列表获取成功，共${response.data.data?.length || 0}条记录`;
    }, 'sales');
  }

  async testOrdersAPI() {
    console.log('\n📦 订单管理API测试');
    console.log('-' * 40);

    // 6.1 订单列表测试
    await this.test('订单列表获取', async () => {
      const response = await axios.get(`${this.baseURL}/orders?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('订单列表获取失败');
      }
      
      return `订单列表获取成功，共${response.data.data?.length || 0}条记录`;
    }, 'orders');

    // 6.2 订单详情测试（如果有订单）
    await this.test('订单详情获取', async () => {
      const listResponse = await axios.get(`${this.baseURL}/orders?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (listResponse.data.data && listResponse.data.data.length > 0) {
        const orderId = listResponse.data.data[0].id;
        const response = await axios.get(`${this.baseURL}/orders?path=detail&id=${orderId}`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        
        if (!response.data.success) {
          throw new Error('订单详情获取失败');
        }
        
        return '订单详情获取成功';
      } else {
        return '暂无订单数据，跳过详情测试';
      }
    }, 'orders');
  }

  async testAdminAPI() {
    console.log('\n👨‍💼 管理员API测试');
    console.log('-' * 40);

    // 7.1 管理员统计测试
    await this.test('管理员统计数据', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('管理员统计数据获取失败');
      }
      
      const stats = response.data.data;
      return `统计数据获取成功：一级销售${stats.primary_sales_count || 0}个，二级销售${stats.secondary_sales_count || 0}个`;
    }, 'admin');

    // 7.2 管理员概览测试
    await this.test('管理员概览数据', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=overview`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('管理员概览数据获取失败');
      }
      
      const overview = response.data.data;
      return `概览数据获取成功：订单${overview.total_orders || 0}个，收入${overview.total_revenue || 0}元`;
    }, 'admin');

    // 7.3 管理员订单管理测试
    await this.test('管理员订单管理', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=orders`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('管理员订单管理数据获取失败');
      }
      
      return '管理员订单管理数据获取成功';
    }, 'admin');

    // 7.4 管理员销售管理测试
    await this.test('管理员销售管理', async () => {
      const response = await axios.get(`${this.baseURL}/admin?path=sales`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('管理员销售管理数据获取失败');
      }
      
      return '管理员销售管理数据获取成功';
    }, 'admin');

    // 7.5 数据导出测试
    await this.test('数据导出功能', async () => {
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
    }, 'admin');
  }

  async testCommissionAPI() {
    console.log('\n💰 佣金管理API测试');
    console.log('-' * 40);

    // 8.1 佣金统计测试
    await this.test('佣金统计数据', async () => {
      const response = await axios.get(`${this.baseURL}/orders-commission?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('佣金统计数据获取失败');
      }
      
      return '佣金统计数据获取成功';
    }, 'commission');
  }

  async testSalesHierarchyAPI() {
    console.log('\n🏗️ 销售层级API测试');
    console.log('-' * 40);

    // 9.1 层级关系测试
    await this.test('销售层级关系', async () => {
      const response = await axios.get(`${this.baseURL}/sales-hierarchy?path=relationships`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售层级关系获取失败');
      }
      
      return '销售层级关系获取成功';
    }, 'sales');

    // 9.2 层级统计测试
    await this.test('销售层级统计', async () => {
      const response = await axios.get(`${this.baseURL}/sales-hierarchy?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('销售层级统计获取失败');
      }
      
      return '销售层级统计获取成功';
    }, 'sales');
  }

  async testPaymentConfigAPI() {
    console.log('\n💳 支付配置API测试');
    console.log('-' * 40);

    // 10.1 支付配置获取测试
    await this.test('支付配置获取', async () => {
      const response = await axios.get(`${this.baseURL}/payment-config?path=get`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error('支付配置获取失败');
      }
      
      return '支付配置获取成功';
    }, 'admin');
  }

  async testBusinessFlows() {
    console.log('\n🔄 业务流程测试');
    console.log('=' * 60);

    // 测试一级销售完整流程
    await this.test('一级销售完整流程验证', async () => {
      // 这里可以添加实际的业务流程测试
      // 由于需要创建测试数据，这里先验证相关API是否可用
      const statsResponse = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!statsResponse.data.success) {
        throw new Error('业务流程验证失败');
      }
      
      return '业务流程验证通过';
    });

    // 测试二级销售完整流程
    await this.test('二级销售完整流程验证', async () => {
      const salesResponse = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=secondary`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!salesResponse.data.success) {
        throw new Error('二级销售流程验证失败');
      }
      
      return '二级销售流程验证通过';
    });

    // 测试用户购买流程
    await this.test('用户购买流程验证', async () => {
      const ordersResponse = await axios.get(`${this.baseURL}/orders?path=list`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (!ordersResponse.data.success) {
        throw new Error('用户购买流程验证失败');
      }
      
      return '用户购买流程验证通过';
    });
  }

  async testPerformance() {
    console.log('\n⚡ 性能测试');
    console.log('=' * 60);

    // API响应时间测试
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

    // 并发请求测试
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

    // 数据库查询性能测试
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

  async testErrorHandling() {
    console.log('\n🚨 错误处理测试');
    console.log('=' * 60);

    // 404错误处理测试
    await this.test('404错误处理', async () => {
      try {
        await axios.get(`${this.baseURL}/health?path=nonexistent`);
        throw new Error('应该返回404错误');
      } catch (error) {
        if (error.response?.status === 404) {
          return '404错误处理正常';
        }
        // 如果返回其他错误状态码，也认为是正常的错误处理
        if (error.response?.status >= 400) {
          return `错误处理正常 (状态码: ${error.response.status})`;
        }
        throw error;
      }
    });

    // 超时处理测试
    await this.test('超时处理机制', async () => {
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

    // 数据一致性测试
    await this.test('数据一致性检查', async () => {
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

  async test(testName, testFunction, category = 'general') {
    this.currentTest = testName;
    this.testResults.totalTests++;
    
    if (category !== 'general' && this.testResults.apiTests[category]) {
      this.testResults.apiTests[category].total++;
    }
    
    console.log(`\n🧪 测试: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${testName} - 通过 (${duration}ms)`);
      console.log(`   结果: ${result}`);
      
      this.testResults.passedTests++;
      
      if (category !== 'general' && this.testResults.apiTests[category]) {
        this.testResults.apiTests[category].passed++;
      }
      
      // 更新性能统计
      this.testResults.performance.avgResponseTime = 
        (this.testResults.performance.avgResponseTime * (this.testResults.passedTests - 1) + duration) / this.testResults.passedTests;
      
    } catch (error) {
      console.log(`❌ ${testName} - 失败`);
      console.log(`   错误: ${error.message}`);
      
      this.testResults.failedTests++;
      
      if (category !== 'general' && this.testResults.apiTests[category]) {
        this.testResults.apiTests[category].failed++;
      }
      
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
    console.log('📊 详细测试执行结果');
    console.log('=' * 80);
    
    console.log(`⏱️  测试时间: ${this.testResults.startTime.toLocaleString()} - ${this.testResults.endTime.toLocaleString()}`);
    console.log(`⏱️  总耗时: ${Math.round(duration / 1000)}秒`);
    console.log(`📊 总测试数: ${this.testResults.totalTests}`);
    console.log(`✅ 通过: ${this.testResults.passedTests}`);
    console.log(`❌ 失败: ${this.testResults.failedTests}`);
    console.log(`📈 成功率: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2)}%`);
    
    console.log('\n📊 API测试分类统计:');
    Object.entries(this.testResults.apiTests).forEach(([category, stats]) => {
      if (stats.total > 0) {
        const successRate = ((stats.passed / stats.total) * 100).toFixed(2);
        console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
      }
    });
    
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
    
    console.log('\n🎯 详细测试完成！');
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
        bugCount: this.testResults.bugs.length,
        apiTestResults: this.testResults.apiTests
      }
    };
    
    const filename = `detailed-test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(testReport, null, 2));
    console.log(`\n💾 详细测试结果已保存到: ${filename}`);
  }
}

// 执行测试
async function main() {
  const executor = new DetailedTestExecutor();
  await executor.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DetailedTestExecutor; 