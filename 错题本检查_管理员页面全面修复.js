#!/usr/bin/env node

/**
 * 错题本检查 - 管理员页面全面修复
 * 
 * 检查点：
 * 1. 管理员订单API - 销售微信号关联逻辑修复
 * 2. 管理员销售API - 数据查询逻辑修复  
 * 3. 管理员客户API - 数据查询逻辑修复
 * 4. 前端API调用 - 新增接口配置
 * 5. 订单状态映射 - 中文显示修复
 * 6. 操作按钮逻辑 - 业务流程符合性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 错题本检查开始 - 管理员页面全面修复');
console.log('='.repeat(80));

const checkResults = {
  totalChecks: 0,
  passedChecks: 0,
  failedChecks: 0,
  details: []
};

function addCheckResult(name, passed, expected, actual, solution = '') {
  checkResults.totalChecks++;
  if (passed) {
    checkResults.passedChecks++;
  } else {
    checkResults.failedChecks++;
  }
  
  checkResults.details.push({
    name,
    status: passed ? '✅ PASS' : '❌ FAIL',
    expected,
    actual,
    solution
  });
  
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    console.log(`   期望: ${expected}`);
    console.log(`   实际: ${actual}`);
    if (solution) {
      console.log(`   解决方案: ${solution}`);
    }
  }
}

// 检查点1: 管理员订单API - 销售微信号关联逻辑
console.log('\n📋 检查点1: 管理员订单API - 销售微信号关联逻辑');
console.log('-'.repeat(60));

try {
  const adminApiContent = fs.readFileSync('./api/admin.js', 'utf8');
  
  // 检查是否修复了错误的关联逻辑
  const hasOldBadJoin = adminApiContent.includes('LEFT JOIN sales s ON o.sales_id = s.id');
  const hasNewMultiTableJoin = adminApiContent.includes('LEFT JOIN primary_sales ps ON') && 
                               adminApiContent.includes('LEFT JOIN secondary_sales ss ON') &&
                               adminApiContent.includes('COALESCE(ps.wechat_name, ss.wechat_name, s.wechat_name)');
  
  addCheckResult(
    '销售微信号关联逻辑修复',
    !hasOldBadJoin && hasNewMultiTableJoin,
    '移除错误的单表关联，使用多表关联和COALESCE处理',
    hasOldBadJoin ? '仍存在错误的单表关联' : (hasNewMultiTableJoin ? '已使用正确的多表关联' : '缺少多表关联逻辑')
  );
  
  // 检查订单查询SQL优化
  const hasEnhancedOrderQuery = adminApiContent.includes('sales_type') && 
                                adminApiContent.includes('sales_wechat_name') &&
                                adminApiContent.includes('sales_type_display');
  
  addCheckResult(
    '订单查询字段完整性',
    hasEnhancedOrderQuery,
    '包含sales_type、sales_wechat_name、sales_type_display字段',
    hasEnhancedOrderQuery ? '订单查询字段完整' : '缺少关键查询字段'
  );

} catch (error) {
  addCheckResult(
    '管理员订单API文件检查',
    false,
    'api/admin.js文件可读取',
    `文件读取失败: ${error.message}`,
    '确保api/admin.js文件存在且可访问'
  );
}

// 检查点2: 管理员销售API - 数据查询逻辑
console.log('\n📋 检查点2: 管理员销售API - 数据查询逻辑');
console.log('-'.repeat(60));

try {
  const adminApiContent = fs.readFileSync('./api/admin.js', 'utf8');
  
  // 检查统一销售查询UNION逻辑
  const hasUnionQuery = adminApiContent.includes('FROM primary_sales') && 
                        adminApiContent.includes('UNION ALL') &&
                        adminApiContent.includes('FROM secondary_sales') &&
                        adminApiContent.includes('FROM sales');
  
  addCheckResult(
    '统一销售查询UNION逻辑',
    hasUnionQuery,
    '使用UNION ALL合并一级、二级、遗留销售数据',
    hasUnionQuery ? '已实现统一销售查询' : '缺少UNION查询逻辑'
  );
  
  // 检查销售统计计算
  const hasSalesStats = adminApiContent.includes('Promise.all') && 
                        adminApiContent.includes('config_confirmed = true') &&
                        adminApiContent.includes('order_count') &&
                        adminApiContent.includes('total_amount');
  
  addCheckResult(
    '销售统计计算逻辑',
    hasSalesStats,
    '为每个销售动态计算订单统计，过滤config_confirmed=true',
    hasSalesStats ? '销售统计计算完整' : '缺少销售统计计算逻辑'
  );

} catch (error) {
  addCheckResult(
    '销售API逻辑检查',
    false,
    '销售API查询逻辑正确',
    `检查失败: ${error.message}`
  );
}

// 检查点3: 管理员客户API - 数据查询逻辑
console.log('\n📋 检查点3: 管理员客户API - 数据查询逻辑');
console.log('-'.repeat(60));

try {
  const adminApiContent = fs.readFileSync('./api/admin.js', 'utf8');
  
  // 检查客户查询的多表关联
  const hasCustomerMultiJoin = adminApiContent.includes('handleCustomers') &&
                               adminApiContent.includes('LEFT JOIN primary_sales ps') &&
                               adminApiContent.includes('LEFT JOIN secondary_sales ss') &&
                               adminApiContent.includes('expiry_status');
  
  addCheckResult(
    '客户管理多表关联查询',
    hasCustomerMultiJoin,
    '客户查询支持多表关联和到期状态分类',
    hasCustomerMultiJoin ? '客户查询逻辑完整' : '缺少客户多表关联逻辑'
  );
  
  // 检查客户搜索功能
  const hasCustomerSearch = adminApiContent.includes('customer_wechat') &&
                           adminApiContent.includes('sales_wechat') &&
                           adminApiContent.includes('tradingview_username') &&
                           adminApiContent.includes('reminder_status');
  
  addCheckResult(
    '客户搜索功能完整性',
    hasCustomerSearch,
    '支持客户微信、销售微信、TradingView用户名、催单状态搜索',
    hasCustomerSearch ? '客户搜索功能完整' : '缺少客户搜索功能'
  );

} catch (error) {
  addCheckResult(
    '客户API逻辑检查',
    false,
    '客户API查询逻辑正确',
    `检查失败: ${error.message}`
  );
}

// 检查点4: 前端API调用 - 新增接口配置
console.log('\n📋 检查点4: 前端API调用 - 新增接口配置');
console.log('-'.repeat(60));

try {
  const apiServiceContent = fs.readFileSync('./client/src/services/api.js', 'utf8');
  
  // 检查新增的API方法
  const hasGetSales = apiServiceContent.includes("getSales: (params) => api.get('/admin?path=sales'");
  const hasUpdateCommissionRate = apiServiceContent.includes('updateCommissionRate:') &&
                                  apiServiceContent.includes('update-commission');
  const hasUpdateSalesCommission = apiServiceContent.includes('updateSalesCommission:') &&
                                   apiServiceContent.includes('update-sales-commission');
  
  addCheckResult(
    '新增API方法配置',
    hasGetSales && hasUpdateCommissionRate && hasUpdateSalesCommission,
    'getSales、updateCommissionRate、updateSalesCommission方法已添加',
    `getSales:${hasGetSales}, updateCommissionRate:${hasUpdateCommissionRate}, updateSalesCommission:${hasUpdateSalesCommission}`
  );

} catch (error) {
  addCheckResult(
    '前端API服务检查',
    false,
    'API服务配置正确',
    `检查失败: ${error.message}`
  );
}

// 检查点5: 订单状态映射 - 中文显示修复
console.log('\n📋 检查点5: 订单状态映射 - 中文显示修复');
console.log('-'.repeat(60));

try {
  const adminOrdersContent = fs.readFileSync('./client/src/components/admin/AdminOrders.js', 'utf8');
  
  // 检查中文状态映射
  const hasChineseStatusMap = adminOrdersContent.includes('待付款确认') &&
                              adminOrdersContent.includes('已付款确认') &&
                              adminOrdersContent.includes('待配置确认') &&
                              adminOrdersContent.includes('已配置确认');
  
  addCheckResult(
    '订单状态中文映射',
    hasChineseStatusMap,
    '所有订单状态都有对应的中文显示',
    hasChineseStatusMap ? '状态映射完整' : '缺少中文状态映射'
  );

} catch (error) {
  addCheckResult(
    '订单状态映射检查',
    false,
    '状态映射文件可访问',
    `检查失败: ${error.message}`
  );
}

// 检查点6: 操作按钮逻辑 - 业务流程符合性
console.log('\n📋 检查点6: 操作按钮逻辑 - 业务流程符合性');
console.log('-'.repeat(60));

try {
  const adminOrdersContent = fs.readFileSync('./client/src/components/admin/AdminOrders.js', 'utf8');
  
  // 检查操作按钮的业务流程
  const hasProperFlow = adminOrdersContent.includes('确认付款') &&
                        adminOrdersContent.includes('进入配置阶段') &&
                        adminOrdersContent.includes('确认配置完成') &&
                        adminOrdersContent.includes("case 'pending_payment'") &&
                        adminOrdersContent.includes("case 'confirmed_payment'") &&
                        adminOrdersContent.includes("case 'pending_config'");
  
  addCheckResult(
    '操作按钮业务流程',
    hasProperFlow,
    '按钮操作符合业务流程：确认付款→进入配置→确认完成',
    hasProperFlow ? '业务流程符合要求' : '操作流程不符合需求'
  );
  
  // 检查按钮样式优化
  const hasProperStyling = adminOrdersContent.includes('type="primary"') &&
                           adminOrdersContent.includes('已完成') &&
                           adminOrdersContent.includes('已生效');
  
  addCheckResult(
    '操作按钮样式优化',
    hasProperStyling,
    '主要操作使用primary样式，完成状态有明确标识',
    hasProperStyling ? '按钮样式优化完成' : '缺少按钮样式优化'
  );

} catch (error) {
  addCheckResult(
    '操作按钮逻辑检查',
    false,
    '操作按钮逻辑正确',
    `检查失败: ${error.message}`
  );
}

// 检查点7: 新增API功能检查
console.log('\n📋 检查点7: 新增API功能检查');
console.log('-'.repeat(60));

try {
  const adminApiContent = fs.readFileSync('./api/admin.js', 'utf8');
  
  // 检查新增的处理函数
  const hasUpdateOrderStatus = adminApiContent.includes('handleUpdateOrderStatus') &&
                               adminApiContent.includes("path === 'update-order'");
  const hasUpdateCommission = adminApiContent.includes('handleUpdateCommissionRate') &&
                              adminApiContent.includes("path === 'update-commission'");
  const hasUpdateSalesCommission = adminApiContent.includes('handleUpdateSalesCommission') &&
                                   adminApiContent.includes("path === 'update-sales-commission'");
  
  addCheckResult(
    '新增API处理函数',
    hasUpdateOrderStatus && hasUpdateCommission && hasUpdateSalesCommission,
    '订单状态更新、佣金率更新、销售佣金更新功能已添加',
    `订单状态:${hasUpdateOrderStatus}, 佣金率:${hasUpdateCommission}, 销售佣金:${hasUpdateSalesCommission}`
  );

} catch (error) {
  addCheckResult(
    '新增API功能检查',
    false,
    '新增API功能正确实现',
    `检查失败: ${error.message}`
  );
}

// 生成错题本报告
console.log('\n' + '='.repeat(80));
console.log('📊 错题本检查结果汇总');
console.log('='.repeat(80));

console.log(`总检查项: ${checkResults.totalChecks}`);
console.log(`通过项: ${checkResults.passedChecks} ✅`);
console.log(`失败项: ${checkResults.failedChecks} ❌`);
console.log(`通过率: ${((checkResults.passedChecks / checkResults.totalChecks) * 100).toFixed(1)}%`);

if (checkResults.failedChecks > 0) {
  console.log('\n❌ 失败项详情:');
  checkResults.details
    .filter(detail => detail.status.includes('FAIL'))
    .forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.name}`);
      console.log(`   期望: ${detail.expected}`);
      console.log(`   实际: ${detail.actual}`);
      if (detail.solution) {
        console.log(`   解决方案: ${detail.solution}`);
      }
    });
}

// 保存检查结果
const resultFile = `错题本检查结果_管理员页面修复_${Date.now()}.json`;
fs.writeFileSync(resultFile, JSON.stringify(checkResults, null, 2));
console.log(`\n📄 详细结果已保存至: ${resultFile}`);

// 最终判定
const isReady = checkResults.failedChecks === 0;
console.log('\n' + '='.repeat(80));
if (isReady) {
  console.log('🎉 错题本检查全部通过! 可以进行部署 🚀');
  console.log('✅ 所有修复都符合要求，管理员页面问题已完全解决');
} else {
  console.log('❌ 错题本检查未完全通过，需要修复失败项后重新检查');
  console.log('💡 请根据上述失败项详情进行修复');
}
console.log('='.repeat(80));

process.exit(isReady ? 0 : 1);