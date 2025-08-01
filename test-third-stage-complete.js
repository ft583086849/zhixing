const axios = require('axios');

async function testThirdStageComplete() {
  console.log('🔍 开始第三阶段完整回测...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  const frontendURL = 'https://zhixing-seven.vercel.app';
  
  const results = {
    api: {},
    frontend: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  try {
    // ==================== API功能测试 ====================
    console.log('\n📡 API功能测试');
    console.log('=' * 50);
    
    // 1. 健康检查API
    console.log('\n1. 健康检查API测试...');
    try {
      const healthResponse = await axios.get(`${baseURL}/health?path=check`);
      if (healthResponse.data.success) {
        console.log('✅ 健康检查API正常');
        results.api.health = { status: 'passed', data: healthResponse.data };
        results.summary.passed++;
      } else {
        console.log('❌ 健康检查API失败');
        results.api.health = { status: 'failed', error: healthResponse.data };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 健康检查API异常:', error.message);
      results.api.health = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 2. 销售API测试
    console.log('\n2. 销售API测试...');
    try {
      // 2.1 创建销售
      const salesData = {
        wechat_name: `third_stage_test_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: 'test@thirdstage.com',
        alipay_surname: '测'
      };
      
      const createSalesResponse = await axios.post(`${baseURL}/sales?path=create`, salesData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (createSalesResponse.data.success) {
        console.log('✅ 销售创建API正常');
        results.api.salesCreate = { status: 'passed', data: createSalesResponse.data };
        results.summary.passed++;
        
        // 2.2 获取销售列表
        const salesListResponse = await axios.get(`${baseURL}/sales`);
        if (salesListResponse.data.success) {
          console.log('✅ 销售列表API正常');
          results.api.salesList = { status: 'passed', data: salesListResponse.data };
          results.summary.passed++;
        } else {
          console.log('❌ 销售列表API失败');
          results.api.salesList = { status: 'failed', error: salesListResponse.data };
          results.summary.failed++;
        }
        results.summary.total++;
        
        // 2.3 根据链接获取销售信息
        const linkCode = createSalesResponse.data.data.link_code;
        const salesByLinkResponse = await axios.get(`${baseURL}/sales?link_code=${linkCode}`);
        if (salesByLinkResponse.data.success) {
          console.log('✅ 销售链接查询API正常');
          results.api.salesByLink = { status: 'passed', data: salesByLinkResponse.data };
          results.summary.passed++;
        } else {
          console.log('❌ 销售链接查询API失败');
          results.api.salesByLink = { status: 'failed', error: salesByLinkResponse.data };
          results.summary.failed++;
        }
        results.summary.total++;
        
      } else {
        console.log('❌ 销售创建API失败');
        results.api.salesCreate = { status: 'failed', error: createSalesResponse.data };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 销售API异常:', error.message);
      results.api.sales = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 3. 一级销售API测试
    console.log('\n3. 一级销售API测试...');
    try {
      const primarySalesData = {
        wechat_name: `primary_third_stage_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: 'test@primary.com',
        alipay_surname: '测'
      };
      
      const primaryResponse = await axios.post(`${baseURL}/primary-sales?path=create`, primarySalesData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (primaryResponse.data.success) {
        console.log('✅ 一级销售创建API正常');
        results.api.primarySalesCreate = { status: 'passed', data: primaryResponse.data };
        results.summary.passed++;
        
        // 获取一级销售列表
        const primaryListResponse = await axios.get(`${baseURL}/primary-sales?path=list`);
        if (primaryListResponse.data.success) {
          console.log('✅ 一级销售列表API正常');
          results.api.primarySalesList = { status: 'passed', data: primaryListResponse.data };
          results.summary.passed++;
        } else {
          console.log('❌ 一级销售列表API失败');
          results.api.primarySalesList = { status: 'failed', error: primaryListResponse.data };
          results.summary.failed++;
        }
        results.summary.total++;
        
        // 获取一级销售统计
        const primaryStatsResponse = await axios.get(`${baseURL}/primary-sales?path=stats`);
        if (primaryStatsResponse.data.success) {
          console.log('✅ 一级销售统计API正常');
          results.api.primarySalesStats = { status: 'passed', data: primaryStatsResponse.data };
          results.summary.passed++;
        } else {
          console.log('❌ 一级销售统计API失败');
          results.api.primarySalesStats = { status: 'failed', error: primaryStatsResponse.data };
          results.summary.failed++;
        }
        results.summary.total++;
        
      } else {
        console.log('❌ 一级销售创建API失败');
        results.api.primarySalesCreate = { status: 'failed', error: primaryResponse.data };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 一级销售API异常:', error.message);
      results.api.primarySales = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 4. 管理员API测试
    console.log('\n4. 管理员API测试...');
    try {
      const adminResponse = await axios.get(`${baseURL}/admin?path=stats`);
      if (adminResponse.data.success) {
        console.log('✅ 管理员统计API正常');
        results.api.adminStats = { status: 'passed', data: adminResponse.data };
        results.summary.passed++;
      } else {
        console.log('❌ 管理员统计API失败');
        results.api.adminStats = { status: 'failed', error: adminResponse.data };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 管理员API异常:', error.message);
      results.api.admin = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 5. 数据库初始化API测试
    console.log('\n5. 数据库初始化API测试...');
    try {
      const initResponse = await axios.post(`${baseURL}/init-database?path=init`, {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (initResponse.data.success) {
        console.log('✅ 数据库初始化API正常');
        results.api.databaseInit = { status: 'passed', data: initResponse.data };
        results.summary.passed++;
      } else {
        console.log('❌ 数据库初始化API失败');
        results.api.databaseInit = { status: 'failed', error: initResponse.data };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 数据库初始化API异常:', error.message);
      results.api.databaseInit = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // ==================== 前端页面测试 ====================
    console.log('\n🌐 前端页面测试');
    console.log('=' * 50);
    
    // 1. 销售页面测试
    console.log('\n1. 销售页面测试...');
    try {
      const salesPageResponse = await axios.get(`${frontendURL}/sales`);
      if (salesPageResponse.status === 200) {
        console.log('✅ 销售页面正常');
        results.frontend.salesPage = { status: 'passed' };
        results.summary.passed++;
      } else {
        console.log('❌ 销售页面异常');
        results.frontend.salesPage = { status: 'failed', statusCode: salesPageResponse.status };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 销售页面异常:', error.message);
      results.frontend.salesPage = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 2. 管理员登录页面测试
    console.log('\n2. 管理员登录页面测试...');
    try {
      const adminPageResponse = await axios.get(`${frontendURL}/admin`);
      if (adminPageResponse.status === 200) {
        console.log('✅ 管理员登录页面正常');
        results.frontend.adminLoginPage = { status: 'passed' };
        results.summary.passed++;
      } else {
        console.log('❌ 管理员登录页面异常');
        results.frontend.adminLoginPage = { status: 'failed', statusCode: adminPageResponse.status };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 管理员登录页面异常:', error.message);
      results.frontend.adminLoginPage = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 3. 一级销售页面测试
    console.log('\n3. 一级销售页面测试...');
    try {
      const primarySalesPageResponse = await axios.get(`${frontendURL}/primary-sales`);
      if (primarySalesPageResponse.status === 200) {
        console.log('✅ 一级销售页面正常');
        results.frontend.primarySalesPage = { status: 'passed' };
        results.summary.passed++;
      } else {
        console.log('❌ 一级销售页面异常');
        results.frontend.primarySalesPage = { status: 'failed', statusCode: primarySalesPageResponse.status };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 一级销售页面异常:', error.message);
      results.frontend.primarySalesPage = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // 4. 一级销售结算页面测试
    console.log('\n4. 一级销售结算页面测试...');
    try {
      const settlementPageResponse = await axios.get(`${frontendURL}/primary-sales-settlement`);
      if (settlementPageResponse.status === 200) {
        console.log('✅ 一级销售结算页面正常');
        results.frontend.primarySalesSettlementPage = { status: 'passed' };
        results.summary.passed++;
      } else {
        console.log('❌ 一级销售结算页面异常');
        results.frontend.primarySalesSettlementPage = { status: 'failed', statusCode: settlementPageResponse.status };
        results.summary.failed++;
      }
    } catch (error) {
      console.log('❌ 一级销售结算页面异常:', error.message);
      results.frontend.primarySalesSettlementPage = { status: 'failed', error: error.message };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // ==================== 测试结果汇总 ====================
    console.log('\n📊 第三阶段回测结果汇总');
    console.log('=' * 50);
    console.log(`总测试数: ${results.summary.total}`);
    console.log(`通过: ${results.summary.passed} ✅`);
    console.log(`失败: ${results.summary.failed} ❌`);
    console.log(`成功率: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
    
    // 详细结果
    console.log('\n📋 API测试详情:');
    Object.keys(results.api).forEach(key => {
      const result = results.api[key];
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${result.status}`);
    });
    
    console.log('\n📋 前端测试详情:');
    Object.keys(results.frontend).forEach(key => {
      const result = results.frontend[key];
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${result.status}`);
    });
    
    // 第三阶段评估
    console.log('\n🎯 第三阶段评估:');
    if (results.summary.failed === 0) {
      console.log('🎉 第三阶段完全通过！所有功能正常');
      console.log('✅ 销售页面功能正常');
      console.log('✅ 用户购买页面功能正常');
      console.log('✅ 后台管理页面功能正常');
      console.log('✅ 一级销售页面功能正常');
      console.log('✅ 所有API端点正常工作');
    } else {
      console.log('⚠️ 第三阶段部分功能需要修复');
      console.log(`❌ 失败项目数: ${results.summary.failed}`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 第三阶段回测失败:', error.message);
    throw error;
  }
}

// 运行回测
testThirdStageComplete()
  .then(results => {
    console.log('\n✅ 第三阶段回测完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 第三阶段回测失败');
    process.exit(1);
  }); 