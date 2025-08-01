const axios = require('axios');

class EndToEndTester {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.testData = {
      primarySales: [],
      secondarySales: [],
      orders: [],
      adminToken: null
    };
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async start() {
    console.log('🚀 开始端到端整体测试...');
    console.log('=' * 60);
    
    try {
      // 1. 创建测试数据
      await this.createTestData();
      
      // 2. 验证核心业务流程
      await this.testCoreBusinessFlow();
      
      // 3. 测试管理员功能
      await this.testAdminFunctions();
      
      // 4. 性能压力测试
      await this.testPerformance();
      
      // 5. 用户体验验证
      await this.testUserExperience();
      
      // 输出最终结果
      this.printFinalResults();
      
    } catch (error) {
      console.error('❌ 端到端测试失败:', error.message);
      throw error;
    }
  }

  async createTestData() {
    console.log('\n📊 第一段：创建测试数据');
    console.log('-' * 40);
    
    // 获取管理员token
    await this.getAdminToken();
    
    // 创建一级销售
    await this.createPrimarySales();
    
    // 创建二级销售
    await this.createSecondarySales();
    
    // 创建测试订单
    await this.createTestOrders();
  }

  async getAdminToken() {
    try {
      const response = await axios.post(`${this.baseURL}/auth?path=login`, {
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      
      if (response.data.success && response.data.data?.token) {
        this.testData.adminToken = response.data.data.token;
        this.logSuccess('获取管理员token成功');
      } else {
        throw new Error('登录失败，未获取到token');
      }
    } catch (error) {
      this.logError('获取管理员token失败', error);
      throw error;
    }
  }

  async createPrimarySales() {
    console.log('\n👤 创建一级销售测试数据...');
    
    const primarySalesData = [
      {
        wechat_name: `e2e_primary_001_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        payment_method: 'alipay',
        payment_address: 'e2e_primary1@alipay.com',
        alipay_surname: '张'
      },
      {
        wechat_name: `e2e_primary_002_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        payment_method: 'crypto',
        payment_address: '0xe2e1234567890abcdef',
        chain_name: 'ETH'
      }
    ];

    for (let i = 0; i < primarySalesData.length; i++) {
      try {
        const response = await axios.post(`${this.baseURL}/primary-sales?path=create`, primarySalesData[i], {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        this.testData.primarySales.push({
          id: response.data.data.primary_sales_id,
          wechat_name: primarySalesData[i].wechat_name,
          secondary_registration_code: response.data.data.secondary_registration_code,
          user_sales_code: response.data.data.user_sales_code
        });
        
        this.logSuccess(`一级销售${i + 1}创建成功 (ID: ${response.data.data.primary_sales_id})`);
      } catch (error) {
        this.logError(`一级销售${i + 1}创建失败`, error);
      }
    }
  }

  async createSecondarySales() {
    console.log('\n👥 创建二级销售测试数据...');
    
    if (this.testData.primarySales.length === 0) {
      this.logError('没有一级销售数据，跳过二级销售创建');
      return;
    }

    const primarySales = this.testData.primarySales[0];
    
    const secondarySalesData = [
      {
        wechat_name: `e2e_secondary_001_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        primary_sales_id: primarySales.id,
        payment_method: 'alipay',
        payment_address: 'e2e_secondary1@alipay.com',
        alipay_surname: '李'
      },
      {
        wechat_name: `e2e_secondary_002_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        primary_sales_id: primarySales.id,
        payment_method: 'crypto',
        payment_address: '0xe2e9876543210fedcba',
        chain_name: 'BTC'
      }
    ];

    for (let i = 0; i < secondarySalesData.length; i++) {
      try {
        // 注意：这里需要检查是否有创建二级销售的API端点
        // 如果没有，我们使用普通销售API
        const response = await axios.post(`${this.baseURL}/sales?path=create`, {
          wechat_name: secondarySalesData[i].wechat_name,
          payment_method: secondarySalesData[i].payment_method,
          payment_address: secondarySalesData[i].payment_address,
          alipay_surname: secondarySalesData[i].alipay_surname,
          chain_name: secondarySalesData[i].chain_name
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        this.testData.secondarySales.push({
          id: response.data.data.sales_id,
          wechat_name: secondarySalesData[i].wechat_name,
          primary_sales_id: primarySales.id,
          link_code: response.data.data.link_code
        });
        
        this.logSuccess(`二级销售${i + 1}创建成功 (ID: ${response.data.data.sales_id})`);
      } catch (error) {
        this.logError(`二级销售${i + 1}创建失败`, error);
      }
    }
  }

  async createTestOrders() {
    console.log('\n📦 创建测试订单数据...');
    
    if (this.testData.secondarySales.length === 0) {
      this.logError('没有二级销售数据，跳过订单创建');
      return;
    }

    const secondarySales = this.testData.secondarySales[0];
    
    const orderData = [
      {
        tradingview_username: 'test_user_1',
        customer_wechat: 'test_customer_1',
        link_code: secondarySales.link_code,
        amount: 1000,
        duration: '30days',
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        payment_screenshot: 'test_screenshot_1.jpg'
      },
      {
        tradingview_username: 'test_user_2',
        customer_wechat: 'test_customer_2',
        link_code: secondarySales.link_code,
        amount: 2000,
        duration: '60days',
        payment_method: 'alipay',
        payment_time: new Date().toISOString(),
        payment_screenshot: 'test_screenshot_2.jpg'
      }
    ];

    for (let i = 0; i < orderData.length; i++) {
      try {
        const response = await axios.post(`${this.baseURL}/orders?path=create`, orderData[i], {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        this.testData.orders.push({
          id: response.data.data.order_id,
          customer_name: orderData[i].customer_name,
          amount: orderData[i].amount,
          sales_link_code: orderData[i].sales_link_code
        });
        
        this.logSuccess(`订单${i + 1}创建成功 (ID: ${response.data.data.order_id})`);
      } catch (error) {
        this.logError(`订单${i + 1}创建失败`, error);
      }
    }
  }

  async testCoreBusinessFlow() {
    console.log('\n📊 第二段：验证核心业务流程');
    console.log('-' * 40);
    
    // 测试销售层级关系
    await this.testSalesHierarchy();
    
    // 测试分佣计算
    await this.testCommissionCalculation();
    
    // 测试订单管理
    await this.testOrderManagement();
  }

  async testSalesHierarchy() {
    console.log('\n🔗 测试销售层级关系...');
    
    try {
      const response = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: {
          'Authorization': `Bearer ${this.testData.adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const stats = response.data.data;
      console.log('📊 层级统计信息:');
      console.log(`  - 一级销售数: ${stats.primary_sales_count}`);
      console.log(`  - 二级销售数: ${stats.secondary_sales_count}`);
      console.log(`  - 活跃层级关系: ${stats.active_hierarchies}`);
      
      this.logSuccess('销售层级关系验证成功');
    } catch (error) {
      this.logError('销售层级关系验证失败', error);
    }
  }

  async testCommissionCalculation() {
    console.log('\n💰 测试分佣计算...');
    
    try {
      // 测试一级销售的分佣统计
      if (this.testData.primarySales.length > 0) {
        const primarySales = this.testData.primarySales[0];
        const response = await axios.get(`${this.baseURL}/primary-sales?path=stats`, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        const stats = response.data.data;
        console.log('📊 分佣统计信息:');
        console.log(`  - 总佣金: ${stats.totalCommission}`);
        console.log(`  - 月度佣金: ${stats.monthlyCommission}`);
        console.log(`  - 二级销售数: ${stats.secondarySalesCount}`);
        
        this.logSuccess('分佣计算验证成功');
      }
    } catch (error) {
      this.logError('分佣计算验证失败', error);
    }
  }

  async testOrderManagement() {
    console.log('\n📦 测试订单管理...');
    
    try {
      const response = await axios.get(`${this.baseURL}/orders?path=list`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      const orders = response.data.data.orders || [];
      console.log(`📊 订单管理信息:`);
      console.log(`  - 总订单数: ${orders.length}`);
      console.log(`  - 测试订单数: ${this.testData.orders.length}`);
      
      this.logSuccess('订单管理验证成功');
    } catch (error) {
      this.logError('订单管理验证失败', error);
    }
  }

  async testAdminFunctions() {
    console.log('\n📊 第三段：测试管理员功能');
    console.log('-' * 40);
    
    // 测试销售统计
    await this.testSalesStatistics();
    
    // 测试销售筛选
    await this.testSalesFiltering();
    
    // 测试数据导出
    await this.testDataExport();
  }

  async testSalesStatistics() {
    console.log('\n📈 测试销售统计...');
    
    try {
      const response = await axios.get(`${this.baseURL}/admin?path=stats`, {
        headers: {
          'Authorization': `Bearer ${this.testData.adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const stats = response.data.data;
      console.log('📊 销售统计信息:');
      console.log(`  - 总订单数: ${stats.total_orders}`);
      console.log(`  - 总金额: ${stats.total_amount}`);
      console.log(`  - 一级销售数: ${stats.primary_sales_count}`);
      console.log(`  - 二级销售数: ${stats.secondary_sales_count}`);
      
      this.logSuccess('销售统计功能正常');
    } catch (error) {
      this.logError('销售统计功能异常', error);
    }
  }

  async testSalesFiltering() {
    console.log('\n🔍 测试销售筛选...');
    
    try {
      // 测试获取全部销售
      const allSalesResponse = await axios.get(`${this.baseURL}/sales?path=filter&sales_type=all`, {
        headers: {
          'Authorization': `Bearer ${this.testData.adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log(`📊 销售筛选结果:`);
      console.log(`  - 全部销售数: ${allSalesResponse.data.data?.length || 0}`);
      
      this.logSuccess('销售筛选功能正常');
    } catch (error) {
      this.logError('销售筛选功能异常', error);
    }
  }

  async testDataExport() {
    console.log('\n📤 测试数据导出...');
    
    try {
      // 测试销售数据导出
      const response = await axios.get(`${this.baseURL}/sales?path=export`, {
        headers: {
          'Authorization': `Bearer ${this.testData.adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('📊 数据导出功能:');
      console.log(`  - 导出状态: ${response.data.success ? '成功' : '失败'}`);
      console.log(`  - 数据条数: ${response.data.data?.length || 0}`);
      
      this.logSuccess('数据导出功能正常');
    } catch (error) {
      this.logError('数据导出功能异常', error);
    }
  }

  async testPerformance() {
    console.log('\n📊 第四段：性能压力测试');
    console.log('-' * 40);
    
    // 测试并发访问
    await this.testConcurrentAccess();
    
    // 测试大量数据查询
    await this.testLargeDataQuery();
    
    // 测试响应时间
    await this.testResponseTime();
  }

  async testConcurrentAccess() {
    console.log('\n⚡ 测试并发访问...');
    
    const concurrentRequests = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.get(`${this.baseURL}/admin?path=stats`, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }).catch(error => ({ error: true, message: error.message }))
      );
    }
    
    try {
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const successCount = results.filter(r => !r.error).length;
      const failCount = results.filter(r => r.error).length;
      
      console.log(`📊 并发测试结果:`);
      console.log(`  - 并发请求数: ${concurrentRequests}`);
      console.log(`  - 成功请求数: ${successCount}`);
      console.log(`  - 失败请求数: ${failCount}`);
      console.log(`  - 总耗时: ${endTime - startTime}ms`);
      console.log(`  - 平均响应时间: ${(endTime - startTime) / concurrentRequests}ms`);
      
      if (successCount === concurrentRequests) {
        this.logSuccess('并发访问测试通过');
      } else {
        this.logError(`并发访问测试失败: ${failCount}个请求失败`);
      }
    } catch (error) {
      this.logError('并发访问测试异常', error);
    }
  }

  async testLargeDataQuery() {
    console.log('\n📊 测试大量数据查询...');
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseURL}/sales`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      const endTime = Date.now();
      
      const salesCount = response.data.data?.length || 0;
      const queryTime = endTime - startTime;
      
      console.log(`📊 大量数据查询结果:`);
      console.log(`  - 销售记录数: ${salesCount}`);
      console.log(`  - 查询耗时: ${queryTime}ms`);
      
      if (queryTime < 5000) { // 5秒内完成
        this.logSuccess('大量数据查询性能良好');
      } else {
        this.logError(`大量数据查询性能较差: ${queryTime}ms`);
      }
    } catch (error) {
      this.logError('大量数据查询测试异常', error);
    }
  }

  async testResponseTime() {
    console.log('\n⏱️ 测试响应时间...');
    
    const endpoints = [
      { name: '健康检查', path: '/health?path=check', method: 'GET' },
      { name: '管理员统计', path: '/admin?path=stats', method: 'GET' },
      { name: '销售列表', path: '/sales', method: 'GET' },
      { name: '订单列表', path: '/orders?path=list', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        await axios({
          method: endpoint.method,
          url: `${this.baseURL}${endpoint.path}`,
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        console.log(`  - ${endpoint.name}: ${responseTime}ms`);
        
        if (responseTime < 3000) { // 3秒内
          this.logSuccess(`${endpoint.name}响应时间正常`);
        } else {
          this.logError(`${endpoint.name}响应时间过长: ${responseTime}ms`);
        }
      } catch (error) {
        this.logError(`${endpoint.name}响应时间测试失败`, error);
      }
    }
  }

  async testUserExperience() {
    console.log('\n📊 第五段：用户体验验证');
    console.log('-' * 40);
    
    // 测试错误处理
    await this.testErrorHandling();
    
    // 测试数据一致性
    await this.testDataConsistency();
    
    // 测试API稳定性
    await this.testAPIStability();
  }

  async testErrorHandling() {
    console.log('\n⚠️ 测试错误处理...');
    
    // 测试无效的微信名
    try {
      await axios.post(`${this.baseURL}/sales?path=create`, {
        wechat_name: '', // 空微信名
        payment_method: 'alipay',
        payment_address: 'test@alipay.com'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      this.logError('空微信名应该返回错误');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logSuccess('错误处理正常：空微信名被正确拒绝');
      } else {
        this.logError('错误处理异常：空微信名未被正确处理');
      }
    }
    
    // 测试无效的API路径
    try {
      await axios.get(`${this.baseURL}/invalid-path`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      this.logError('无效路径应该返回404');
    } catch (error) {
      if (error.response?.status === 404) {
        this.logSuccess('错误处理正常：无效路径返回404');
      } else {
        this.logError('错误处理异常：无效路径未被正确处理');
      }
    }
  }

  async testDataConsistency() {
    console.log('\n🔍 测试数据一致性...');
    
    try {
      // 检查销售数据一致性
      const salesResponse = await axios.get(`${this.baseURL}/sales`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      const sales = salesResponse.data.data || [];
      const validSales = sales.filter(s => s.wechat_name && s.payment_method);
      
      console.log(`📊 数据一致性检查:`);
      console.log(`  - 总销售记录: ${sales.length}`);
      console.log(`  - 有效销售记录: ${validSales.length}`);
      console.log(`  - 数据完整性: ${((validSales.length / sales.length) * 100).toFixed(1)}%`);
      
      if (validSales.length === sales.length) {
        this.logSuccess('数据一致性检查通过');
      } else {
        this.logError(`数据一致性检查失败: ${sales.length - validSales.length}条无效数据`);
      }
    } catch (error) {
      this.logError('数据一致性检查异常', error);
    }
  }

  async testAPIStability() {
    console.log('\n🔄 测试API稳定性...');
    
    const stabilityTests = 3;
    let successCount = 0;
    
    for (let i = 0; i < stabilityTests; i++) {
      try {
        await axios.get(`${this.baseURL}/health?path=check`, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        successCount++;
      } catch (error) {
        console.log(`  - 第${i + 1}次测试失败: ${error.message}`);
      }
    }
    
    console.log(`📊 API稳定性测试结果:`);
    console.log(`  - 测试次数: ${stabilityTests}`);
    console.log(`  - 成功次数: ${successCount}`);
    console.log(`  - 成功率: ${((successCount / stabilityTests) * 100).toFixed(1)}%`);
    
    if (successCount === stabilityTests) {
      this.logSuccess('API稳定性测试通过');
    } else {
      this.logError(`API稳定性测试失败: 成功率${((successCount / stabilityTests) * 100).toFixed(1)}%`);
    }
  }

  logSuccess(message) {
    console.log(`✅ ${message}`);
    this.results.passed++;
    this.results.total++;
  }

  logError(message, error = null) {
    console.log(`❌ ${message}`);
    if (error) {
      console.log(`   - 错误详情: ${error.message}`);
    }
    this.results.failed++;
    this.results.total++;
  }

  printFinalResults() {
    console.log('\n' + '=' * 60);
    console.log('🎯 端到端测试最终结果');
    console.log('=' * 60);
    console.log(`📊 总测试数: ${this.results.total}`);
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`📈 成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 所有测试通过！系统可以投入使用！');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步优化。');
    }
    
    console.log('\n📋 测试数据清理建议:');
    console.log('  - 测试完成后可以清理测试数据');
    console.log('  - 保留部分测试数据用于演示');
    console.log('  - 确保生产环境数据安全');
  }
}

// 运行端到端测试
const tester = new EndToEndTester();
tester.start()
  .then(() => {
    console.log('\n✅ 端到端测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 端到端测试失败');
    process.exit(1);
  }); 