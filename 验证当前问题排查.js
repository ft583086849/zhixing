#!/usr/bin/env node

/**
 * 验证当前问题排查 - 检查销售管理和客户管理的数据显示问题
 */

const fs = require('fs');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // 青色
    success: '\x1b[32m', // 绿色
    warning: '\x1b[33m', // 黄色
    error: '\x1b[31m',   // 红色
    reset: '\x1b[0m'
  };
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function checkFileContent(filePath, patterns) {
  if (!fs.existsSync(filePath)) {
    log(`❌ 文件不存在: ${filePath}`, 'error');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  patterns.forEach(({ pattern, description, expectFound = true }) => {
    const found = pattern.test(content);
    if (found === expectFound) {
      if (expectFound) {
        log(`   ✅ ${description} - 已找到`, 'success');
      } else {
        log(`   ✅ ${description} - 已正确移除`, 'success');
      }
    } else {
      if (expectFound) {
        log(`   ❌ ${description} - 未找到`, 'error');
      } else {
        log(`   ❌ ${description} - 仍然存在`, 'error');
      }
    }
  });
}

function main() {
  log('🔍 开始验证当前问题排查...', 'info');
  
  // 检查销售管理页面的修改
  log('\n📄 检查销售管理页面修改:', 'info');
  checkFileContent('client/src/components/admin/AdminSales.js', [
    {
      pattern: /title: '已配置确认订单金额'/,
      description: '有效订单金额已改为已配置确认订单金额',
      expectFound: true
    },
    {
      pattern: /name="config_confirmed_filter"/,
      description: '已添加配置确认状态筛选框',
      expectFound: true
    },
    {
      pattern: /label="配置确认状态"/,
      description: '配置确认状态筛选框标签正确',
      expectFound: true
    }
  ]);
  
  // 检查客户管理页面的修改
  log('\n📄 检查客户管理页面修改:', 'info');
  checkFileContent('client/src/components/admin/AdminCustomers.js', [
    {
      pattern: /name="config_confirmed_filter"/,
      description: '已添加配置确认状态筛选框',
      expectFound: true
    },
    {
      pattern: /label="配置确认状态"/,
      description: '配置确认状态筛选框标签正确',
      expectFound: true
    }
  ]);
  
  // 检查后端API的数据统计问题
  log('\n📄 检查后端API数据统计:', 'info');
  checkFileContent('api/admin.js', [
    {
      pattern: /COALESCE\(SUM\(o\.commission_amount\), 0\) as total_commission/,
      description: '数据概览API已添加佣金统计',
      expectFound: true
    },
    {
      pattern: /total_commission: parseFloat\(stats\.total_commission\) \|\| 0/,
      description: '返回数据包含佣金统计',
      expectFound: true
    },
    {
      pattern: /orderId: parseInt\(id\)/,
      description: '订单状态更新返回正确的字段名',
      expectFound: true
    }
  ]);
  
  log('\n💡 可能的问题分析:', 'info');
  log('   1. 如果销售管理显示数据为空，可能是后端sales API没有正确关联订单数据', 'warning');
  log('   2. 如果客户管理金额为空，可能是后端customers API的统计逻辑有问题', 'warning');
  log('   3. 如果订单状态更新失败，可能是前端期望的响应格式不匹配', 'warning');
  log('   4. 可能需要检查数据库中是否真的有订单数据', 'warning');
  
  log('\n🔧 建议的修复步骤:', 'info');
  log('   1. 检查后端API中销售数据的订单关联逻辑', 'info');
  log('   2. 验证客户管理API的金额计算SQL查询', 'info');
  log('   3. 确保前端正确处理订单状态更新的响应', 'info');
  log('   4. 检查数据库中orders表是否有有效数据', 'info');
  
  return true;
}

if (require.main === module) {
  main();
}

module.exports = { main };