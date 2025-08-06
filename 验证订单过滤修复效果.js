#!/usr/bin/env node

/**
 * 验证订单过滤修复效果 - 检查config_confirmed过滤条件是否已正确移除
 * 
 * 修复内容：
 * 1. 移除销售管理页面的config_confirmed=true过滤条件
 * 2. 移除客户管理API的config_confirmed=true过滤条件
 * 3. 移除一级销售对账页面的config_confirmed过滤条件
 * 4. 增强数据概览API的佣金统计功能
 */

const fs = require('fs');
const path = require('path');

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

function checkFileContent(filePath, patterns, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ 文件不存在: ${filePath}`, 'error');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  log(`\n📄 检查文件: ${filePath}`, 'info');
  log(`   描述: ${description}`, 'info');
  
  let allPassed = true;
  
  patterns.forEach(({ pattern, expected, description: patternDesc }) => {
    const found = pattern.test(content);
    const matches = content.match(pattern);
    
    if (found === expected) {
      if (expected) {
        log(`   ✅ ${patternDesc} - 已找到: ${matches ? matches[0] : ''}`, 'success');
      } else {
        log(`   ✅ ${patternDesc} - 已正确移除`, 'success');
      }
    } else {
      if (expected) {
        log(`   ❌ ${patternDesc} - 未找到预期内容`, 'error');
      } else {
        log(`   ❌ ${patternDesc} - 仍然存在过时的过滤条件: ${matches ? matches[0] : ''}`, 'error');
      }
      allPassed = false;
    }
  });
  
  return allPassed;
}

function main() {
  log('🔍 开始验证订单过滤修复效果...', 'info');
  
  const checks = [
    {
      file: 'api/admin.js',
      description: '客户管理API - 移除config_confirmed过滤',
      patterns: [
        {
          pattern: /let whereConditions = \['o\.config_confirmed = true'\]/,
          expected: false,
          description: '确认已移除config_confirmed过滤条件'
        },
        {
          pattern: /let whereConditions = \[\]; \/\/ 显示所有订单，不再过滤配置状态/,
          expected: true,
          description: '确认已添加新的注释说明'
        },
        {
          pattern: /COALESCE\(SUM\(o\.commission_amount\), 0\) as total_commission/,
          expected: true,
          description: '确认已添加佣金统计字段'
        },
        {
          pattern: /total_commission: parseFloat\(stats\.total_commission\) \|\| 0/,
          expected: true,
          description: '确认返回数据包含佣金统计'
        }
      ]
    },
    {
      file: 'api/secondary-sales.js',
      description: '二级销售API - 移除config_confirmed过滤',
      patterns: [
        {
          pattern: /let orderWhereConditions = \['o\.config_confirmed = true'\]/,
          expected: false,
          description: '确认已移除config_confirmed过滤条件'
        },
        {
          pattern: /let orderWhereConditions = \[\]; \/\/ 查询所有订单，不再过滤配置状态/,
          expected: true,
          description: '确认已添加新的注释说明'
        }
      ]
    },
    {
      file: 'client/src/components/admin/AdminSales.js',
      description: '销售管理页面 - 移除config_confirmed过滤',
      patterns: [
        {
          pattern: /const confirmedOrders = record\.orders\.filter\(order => order\.config_confirmed === true\)/,
          expected: false,
          description: '确认已移除佣金计算中的config_confirmed过滤'
        },
        {
          pattern: /const confirmedOrders = record\.orders;/,
          expected: true,
          description: '确认已更新为显示所有订单'
        },
        {
          pattern: /order\.status === 'confirmed_configuration' && order\.config_confirmed === true/,
          expected: false,
          description: '确认已移除订单状态计算中的config_confirmed过滤'
        },
        {
          pattern: /const validOrders = record\.orders \|\| \[\]/,
          expected: true,
          description: '确认总金额计算已移除config_confirmed过滤'
        }
      ]
    },
    {
      file: 'client/src/pages/PrimarySalesSettlementPage.js',
      description: '一级销售对账页面 - 移除config_confirmed过滤',
      patterns: [
        {
          pattern: /const confirmedOrders = mockOrders\.data\.filter\(order => order\.config_confirmed === true\)/,
          expected: false,
          description: '确认已移除模拟数据的config_confirmed过滤'
        },
        {
          pattern: /const confirmedOrders = mockOrders\.data;/,
          expected: true,
          description: '确认已更新为显示所有模拟订单'
        },
        {
          pattern: /const confirmedOrders = primarySalesOrders\.data\.filter\(order => order\.config_confirmed === true\)/,
          expected: false,
          description: '确认已移除实际数据的config_confirmed过滤'
        },
        {
          pattern: /const confirmedOrders = primarySalesOrders\.data;/,
          expected: true,
          description: '确认已更新为显示所有实际订单'
        }
      ]
    }
  ];
  
  let allChecksPassed = true;
  
  checks.forEach(check => {
    const passed = checkFileContent(check.file, check.patterns, check.description);
    if (!passed) {
      allChecksPassed = false;
    }
  });
  
  // 输出总结
  log('\n📋 修复效果总结:', 'info');
  
  if (allChecksPassed) {
    log('✅ 所有检查项目都已通过！', 'success');
    log('', 'info');
    log('🎉 修复完成！影响范围：', 'success');
    log('   1. ✅ 销售管理页面 - 现在显示所有订单，不再过滤配置状态', 'success');
    log('   2. ✅ 客户管理页面 - 现在统计所有订单，不再过滤配置状态', 'success'); 
    log('   3. ✅ 一级销售对账页面 - 现在计算所有订单的佣金', 'success');
    log('   4. ✅ 数据概览API - 增加了佣金统计功能', 'success');
    log('', 'info');
    log('💡 预期效果：', 'info');
    log('   - 数据概览中的业绩统计应该显示非零数据', 'info');
    log('   - 一级销售业绩和二级销售业绩应该正确显示', 'info');
    log('   - 待返佣金额等统计应该显示正确的金额', 'info');
    
  } else {
    log('❌ 部分检查项目失败，请检查上述错误信息', 'error');
    allChecksPassed = false;
  }
  
  log('', 'info');
  log('🚀 建议下一步操作：', 'info');
  log('   1. 重新部署应用以使修改生效', 'info');
  log('   2. 测试数据概览页面的统计数据', 'info');
  log('   3. 验证销售管理和客户管理页面的数据显示', 'info');
  
  return allChecksPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };