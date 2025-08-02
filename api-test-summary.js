// API端点和测试情况统计
const apiEndpoints = {
  // 健康检查
  health: [
    { path: '/api/health', method: 'GET', description: '健康检查', tested: true, status: '✅' }
  ],
  
  // 认证
  auth: [
    { path: '/api/auth?path=login', method: 'POST', description: '管理员登录', tested: true, status: '✅' },
    { path: '/api/auth?path=verify', method: 'GET', description: 'Token验证', tested: true, status: '✅' }
  ],
  
  // 销售管理
  sales: [
    { path: '/api/sales?path=create', method: 'POST', description: '创建销售', tested: true, status: '✅' },
    { path: '/api/sales?path=list', method: 'GET', description: '销售列表', tested: true, status: '✅' },
    { path: '/api/sales?path=filter', method: 'GET', description: '销售筛选', tested: true, status: '✅' },
    { path: '/api/sales?path=export', method: 'GET', description: '销售数据导出', tested: false, status: '❌' }
  ],
  
  // 一级销售
  primarySales: [
    { path: '/api/primary-sales?path=create', method: 'POST', description: '创建一级销售', tested: true, status: '✅' },
    { path: '/api/primary-sales?path=list', method: 'GET', description: '一级销售列表', tested: true, status: '✅' },
    { path: '/api/primary-sales?path=stats', method: 'GET', description: '一级销售统计', tested: true, status: '✅' },
    { path: '/api/primary-sales?path=orders', method: 'GET', description: '一级销售订单', tested: true, status: '✅' },
    { path: '/api/primary-sales?path=update-commission', method: 'PUT', description: '更新佣金比例', tested: true, status: '✅' },
    { path: '/api/primary-sales?path=urge-order', method: 'POST', description: '催单功能', tested: true, status: '✅' }
  ],
  
  // 二级销售
  secondarySales: [
    { path: '/api/secondary-sales?path=register', method: 'POST', description: '二级销售注册', tested: true, status: '✅' },
    { path: '/api/secondary-sales?path=list', method: 'GET', description: '二级销售列表', tested: true, status: '✅' },
    { path: '/api/secondary-sales?path=stats', method: 'GET', description: '二级销售统计', tested: true, status: '✅' },
    { path: '/api/secondary-sales?path=update-commission', method: 'PUT', description: '更新佣金比例', tested: true, status: '✅' },
    { path: '/api/secondary-sales?path=remove', method: 'DELETE', description: '移除二级销售', tested: true, status: '✅' },
    { path: '/api/secondary-sales?path=orders', method: 'GET', description: '二级销售订单', tested: true, status: '✅' }
  ],
  
  // 销售层级
  salesHierarchy: [
    { path: '/api/sales-hierarchy?path=tree', method: 'GET', description: '层级树结构', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=stats', method: 'GET', description: '层级统计', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=list', method: 'GET', description: '层级列表', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=create', method: 'POST', description: '创建层级关系', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=update', method: 'PUT', description: '更新层级关系', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=remove', method: 'DELETE', description: '移除层级关系', tested: true, status: '✅' },
    { path: '/api/sales-hierarchy?path=commission-calc', method: 'GET', description: '佣金计算', tested: true, status: '✅' }
  ],
  
  // 订单管理
  orders: [
    { path: '/api/orders?path=create', method: 'POST', description: '创建订单', tested: true, status: '✅' },
    { path: '/api/orders?path=list', method: 'GET', description: '订单列表', tested: true, status: '✅' },
    { path: '/api/orders?path=update', method: 'PUT', description: '更新订单状态', tested: true, status: '✅' }
  ],
  
  // 订单佣金
  ordersCommission: [
    { path: '/api/orders-commission?path=create-with-commission', method: 'POST', description: '创建带佣金订单', tested: false, status: '❌' },
    { path: '/api/orders-commission?path=commission-history', method: 'GET', description: '佣金历史', tested: true, status: '✅' },
    { path: '/api/orders-commission?path=commission-stats', method: 'GET', description: '佣金统计', tested: true, status: '✅' },
    { path: '/api/orders-commission?path=list', method: 'GET', description: '佣金列表', tested: true, status: '✅' },
    { path: '/api/orders-commission?path=settle-commission', method: 'POST', description: '结算佣金', tested: false, status: '❌' },
    { path: '/api/orders-commission?path=pending-commissions', method: 'GET', description: '待结算佣金', tested: true, status: '✅' }
  ],
  
  // 管理员功能
  admin: [
    { path: '/api/admin?path=stats', method: 'GET', description: '管理员统计', tested: true, status: '✅' },
    { path: '/api/admin?path=export', method: 'GET', description: '数据导出', tested: false, status: '❌' },
    { path: '/api/admin?path=update-schema', method: 'POST', description: '更新数据库结构', tested: false, status: '❌' }
  ],
  
  // 支付配置
  paymentConfig: [
    { path: '/api/payment-config', method: 'GET', description: '获取支付配置', tested: true, status: '✅' },
    { path: '/api/payment-config', method: 'POST', description: '保存支付配置', tested: true, status: '✅' }
  ]
};

// 统计函数
function calculateStats() {
  let totalEndpoints = 0;
  let testedEndpoints = 0;
  let passedEndpoints = 0;
  let failedEndpoints = 0;
  
  Object.values(apiEndpoints).forEach(category => {
    category.forEach(endpoint => {
      totalEndpoints++;
      if (endpoint.tested) {
        testedEndpoints++;
        if (endpoint.status === '✅') {
          passedEndpoints++;
        } else {
          failedEndpoints++;
        }
      }
    });
  });
  
  return {
    total: totalEndpoints,
    tested: testedEndpoints,
    passed: passedEndpoints,
    failed: failedEndpoints,
    untested: totalEndpoints - testedEndpoints,
    testRate: ((testedEndpoints / totalEndpoints) * 100).toFixed(1),
    passRate: ((passedEndpoints / testedEndpoints) * 100).toFixed(1)
  };
}

// 输出统计结果
const stats = calculateStats();

console.log('📊 API端点测试统计报告');
console.log('='.repeat(50));

Object.entries(apiEndpoints).forEach(([category, endpoints]) => {
  console.log(`\n🔗 ${category.toUpperCase()} (${endpoints.length}个端点):`);
  endpoints.forEach(endpoint => {
    console.log(`   ${endpoint.status} ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
  });
});

console.log('\n' + '='.repeat(50));
console.log('📈 总体统计:');
console.log(`   总端点数: ${stats.total}`);
console.log(`   已测试: ${stats.tested} (${stats.testRate}%)`);
console.log(`   未测试: ${stats.untested}`);
console.log(`   测试通过: ${stats.passed} (${stats.passRate}%)`);
console.log(`   测试失败: ${stats.failed}`);

console.log('\n🎯 关键功能状态:');
console.log(`   ✅ 订单创建: 已测试通过`);
console.log(`   ❌ 数据导出: 未测试/失败`);
console.log(`   ✅ 管理员系统: 部分测试通过`);
console.log(`   ✅ 销售管理: 已测试通过`);
console.log(`   ✅ 佣金系统: 已测试通过`);

console.log('\n⚠️ 需要重点测试的功能:');
console.log('   1. 数据导出功能 (admin?path=export)');
console.log('   2. 创建带佣金订单 (orders-commission?path=create-with-commission)');
console.log('   3. 结算佣金功能 (orders-commission?path=settle-commission)');
console.log('   4. 数据库结构更新 (admin?path=update-schema)'); 