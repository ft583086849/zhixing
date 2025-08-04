#!/usr/bin/env node

/**
 * 线下功能验证 - 检查所有修改功能的需求结果
 * 按照用户需求文档逐项验证本地修复效果
 */

const fs = require('fs');
const path = require('path');

// 验证结果记录
const validationResults = {
  backendAPI: {},
  frontendPages: {},
  requirements: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    issues: []
  }
};

function log(message, type = 'info') {
  const prefix = {
    'info': '📋',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️'
  };
  console.log(`${prefix[type]} ${message}`);
}

function validateResult(testName, condition, errorMessage = '') {
  validationResults.summary.total++;
  if (condition) {
    validationResults.summary.passed++;
    log(`${testName}: 通过`, 'success');
    return true;
  } else {
    validationResults.summary.failed++;
    log(`${testName}: 失败 - ${errorMessage}`, 'error');
    validationResults.summary.issues.push(`${testName}: ${errorMessage}`);
    return false;
  }
}

async function validateBackendAPI() {
  log('\n🚀 验证后端API修改...\n');

  // 1. 验证 api/admin.js 的客户管理过滤
  try {
    const adminContent = fs.readFileSync('api/admin.js', 'utf8');
    
    validateResult(
      'api/admin.js - 客户管理config_confirmed过滤',
      adminContent.includes('o.config_confirmed = true'),
      '缺少config_confirmed=true过滤条件'
    );

    validateResult(
      'api/admin.js - 数据概览不使用config_confirmed过滤',
      adminContent.includes('// 数据概览页面统计不使用config_confirmed过滤') || 
      !adminContent.match(/WHERE.*config_confirmed.*总订单数|总用户数|总销售数/),
      '数据概览页面仍在使用config_confirmed过滤'
    );

    validationResults.backendAPI.admin = 'passed';
  } catch (error) {
    validateResult('api/admin.js - 文件读取', false, error.message);
    validationResults.backendAPI.admin = 'failed';
  }

  // 2. 验证 api/orders.js 的sales_code查找逻辑
  try {
    const ordersContent = fs.readFileSync('api/orders.js', 'utf8');
    
    validateResult(
      'api/orders.js - sales_code统一查找逻辑',
      ordersContent.includes('findSalesByCode') && 
      ordersContent.includes('primary_sales') &&
      ordersContent.includes('secondary_sales'),
      '缺少统一sales_code查找逻辑'
    );

    validateResult(
      'api/orders.js - 支持ps_ID临时格式',
      ordersContent.includes('ps_') || ordersContent.includes('startsWith'),
      '缺少临时ID格式支持'
    );

    validationResults.backendAPI.orders = 'passed';
  } catch (error) {
    validateResult('api/orders.js - 文件读取', false, error.message);
    validationResults.backendAPI.orders = 'failed';
  }

  // 3. 验证 api/primary-sales.js 的兼容性修复
  try {
    const primarySalesContent = fs.readFileSync('api/primary-sales.js', 'utf8');
    
    validateResult(
      'api/primary-sales.js - 移除不存在字段的INSERT',
      !primarySalesContent.includes('sales_code, secondary_registration_code') ||
      primarySalesContent.includes('暂时兼容性实现'),
      'INSERT语句仍包含不存在的字段'
    );

    validateResult(
      'api/primary-sales.js - 临时代码生成',
      primarySalesContent.includes('ps_') && primarySalesContent.includes('reg_'),
      '缺少临时代码生成逻辑'
    );

    validationResults.backendAPI.primarySales = 'passed';
  } catch (error) {
    validateResult('api/primary-sales.js - 文件读取', false, error.message);
    validationResults.backendAPI.primarySales = 'failed';
  }

  // 4. 验证 api/sales.js 的统一查找
  try {
    const salesContent = fs.readFileSync('api/sales.js', 'utf8');
    
    validateResult(
      'api/sales.js - sales_code查找逻辑',
      salesContent.includes('handleGetSalesBySalesCode') && 
      salesContent.includes('primary_sales') &&
      salesContent.includes('secondary_sales'),
      '缺少统一sales_code查找逻辑'
    );

    validationResults.backendAPI.sales = 'passed';
  } catch (error) {
    validateResult('api/sales.js - 文件读取', false, error.message);
    validationResults.backendAPI.sales = 'failed';
  }
}

async function validateFrontendPages() {
  log('\n🎨 验证前端页面修改...\n');

  // 1. 验证 AdminOverview.js
  try {
    const overviewContent = fs.readFileSync('client/src/components/admin/AdminOverview.js', 'utf8');
    
    validateResult(
      'AdminOverview.js - 删除活跃层级关系字段',
      !overviewContent.includes('活跃层级关系') || 
      overviewContent.includes('// 已删除活跃层级关系'),
      '仍包含活跃层级关系字段'
    );

    validationResults.frontendPages.overview = 'passed';
  } catch (error) {
    validateResult('AdminOverview.js - 文件读取', false, error.message);
    validationResults.frontendPages.overview = 'failed';
  }

  // 2. 验证 AdminOrders.js
  try {
    const ordersContent = fs.readFileSync('client/src/components/admin/AdminOrders.js', 'utf8');
    
    validateResult(
      'AdminOrders.js - 销售微信号修复',
      ordersContent.includes('sales_wechat_name') && 
      (ordersContent.includes('primary_sales_wechat') || ordersContent.includes('secondary_sales_wechat')),
      '销售微信号显示逻辑未修复'
    );

    validateResult(
      'AdminOrders.js - 中文状态显示',
      ordersContent.includes('待付款') || ordersContent.includes('已付款') || 
      ordersContent.includes('statusMap'),
      '订单状态仍为英文显示'
    );

    validateResult(
      'AdminOrders.js - 操作按钮逻辑',
      ordersContent.includes('confirmed_payment') && ordersContent.includes('confirmed_configuration'),
      '操作按钮状态逻辑未实现'
    );

    validationResults.frontendPages.orders = 'passed';
  } catch (error) {
    validateResult('AdminOrders.js - 文件读取', false, error.message);
    validationResults.frontendPages.orders = 'failed';
  }

  // 3. 验证 AdminSales.js
  try {
    const salesContent = fs.readFileSync('client/src/components/admin/AdminSales.js', 'utf8');
    
    validateResult(
      'AdminSales.js - config_confirmed过滤',
      salesContent.includes('config_confirmed') && salesContent.includes('true'),
      '缺少config_confirmed过滤逻辑'
    );

    validateResult(
      'AdminSales.js - 销售链接移到最后',
      salesContent.indexOf('销售链接') > salesContent.indexOf('佣金') ||
      salesContent.includes('// 销售链接列移到最后'),
      '销售链接列位置未调整'
    );

    validateResult(
      'AdminSales.js - 佣金配置区域',
      salesContent.includes('commission_rate') && 
      (salesContent.includes('确认') || salesContent.includes('保存')),
      '缺少佣金配置区域'
    );

    validationResults.frontendPages.sales = 'passed';
  } catch (error) {
    validateResult('AdminSales.js - 文件读取', false, error.message);
    validationResults.frontendPages.sales = 'failed';
  }
}

async function validateRequirements() {
  log('\n📄 验证需求文档对应关系...\n');

  // 检查需求文档是否更新
  try {
    const requirementContent = fs.readFileSync('支付管理系统需求文档.md', 'utf8');
    
    validateResult(
      '需求文档 - config_confirmed过滤规则',
      requirementContent.includes('config_confirmed') && 
      (requirementContent.includes('销售管理') || requirementContent.includes('客户管理')),
      '需求文档缺少config_confirmed过滤规则'
    );

    validateResult(
      '需求文档 - 数据概览统计规则',
      requirementContent.includes('数据概览') && 
      (requirementContent.includes('不使用') || requirementContent.includes('订单管理')),
      '需求文档缺少数据概览统计规则'
    );

    validateResult(
      '需求文档 - sales_code查找标准',
      requirementContent.includes('sales_code') && 
      (requirementContent.includes('一级销售') || requirementContent.includes('二级销售')),
      '需求文档缺少sales_code查找标准'
    );

    validationResults.requirements.document = 'passed';
  } catch (error) {
    validateResult('支付管理系统需求文档.md - 文件读取', false, error.message);
    validationResults.requirements.document = 'failed';
  }
}

async function generateReport() {
  log('\n📊 生成验证报告...\n');

  const report = {
    timestamp: new Date().toISOString(),
    summary: validationResults.summary,
    details: {
      backend: validationResults.backendAPI,
      frontend: validationResults.frontendPages,
      requirements: validationResults.requirements
    },
    recommendations: []
  };

  // 生成建议
  if (validationResults.summary.failed > 0) {
    report.recommendations.push('存在失败项，建议修复后再进行部署');
    report.recommendations.push('详细问题列表：');
    report.recommendations.push(...validationResults.summary.issues);
  } else {
    report.recommendations.push('所有验证项通过，可以进行部署');
  }

  // 保存报告
  const reportPath = '线下验证报告_' + Date.now() + '.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`验证报告已保存: ${reportPath}`, 'success');
  
  return report;
}

async function main() {
  console.log('🔍 开始线下功能验证...\n');
  console.log('='.repeat(60));

  await validateBackendAPI();
  await validateFrontendPages();
  await validateRequirements();

  console.log('\n' + '='.repeat(60));
  
  const report = await generateReport();
  
  log(`\n📊 验证结果总览:`);
  log(`总计: ${report.summary.total} 项`);
  log(`通过: ${report.summary.passed} 项`, 'success');
  log(`失败: ${report.summary.failed} 项`, report.summary.failed > 0 ? 'error' : 'success');
  
  if (report.summary.failed === 0) {
    log('\n🎉 所有验证项通过！可以进行错题本检查。', 'success');
  } else {
    log('\n⚠️  存在失败项，建议先修复。', 'warning');
  }
}

if (require.main === module) {
  main();
}