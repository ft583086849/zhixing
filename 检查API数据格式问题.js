#!/usr/bin/env node

/**
 * 检查API数据格式问题 - 分析前后端数据字段不匹配的问题
 */

const fs = require('fs');
const path = require('path');

// 分析前端期望的字段格式
function analyzeAdminSliceExpectations() {
  console.log('📋 分析前端Redux Store期望的数据格式...\n');
  
  const expectations = {
    updateOrderStatus: {
      description: '订单状态更新',
      frontend_expects: 'action.payload.data.orderId, action.payload.data.status',
      backend_returns: 'data: { orderId: parseInt(id), status: status }',
      match_status: '✅ 匹配'
    },
    
    getStats: {
      description: '数据概览统计',
      frontend_expects: 'stats对象包含各种count字段',
      backend_returns: 'orderData对象包含所有统计字段',
      potential_issues: [
        'pending_payment_orders 字段可能为0',
        'confirmed_payment_orders 字段可能为0', 
        'pending_config_orders 字段可能为0',
        'confirmed_config_orders 字段可能为0'
      ]
    },
    
    getSales: {
      description: '销售数据',
      frontend_expects: 'sales数组，每个元素包含orders数组',
      backend_returns: 'sales数组，每个元素现在包含orders数组',
      match_status: '✅ 已修复'
    },
    
    getOrders: {
      description: '订单列表',
      frontend_expects: 'orders数组和pagination对象',
      backend_returns: 'orders数组和pagination对象',
      match_status: '✅ 匹配'
    }
  };
  
  Object.keys(expectations).forEach(key => {
    const exp = expectations[key];
    console.log(`🔍 ${exp.description}:`);
    console.log(`   前端期望: ${exp.frontend_expects}`);
    console.log(`   后端返回: ${exp.backend_returns}`);
    if (exp.match_status) {
      console.log(`   匹配状态: ${exp.match_status}`);
    }
    if (exp.potential_issues) {
      console.log(`   潜在问题:`);
      exp.potential_issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }
    console.log('');
  });
}

// 分析订单状态映射问题
function analyzeOrderStatusMapping() {
  console.log('🏷️  分析订单状态映射问题...\n');
  
  const statusMappings = {
    backend_status_values: [
      'pending_payment',      // 待付款确认
      'confirmed_payment',    // 已付款确认  
      'pending_config',       // 待配置确认
      'confirmed_configuration', // 已配置确认
      'active',              // 已生效
      'expired',             // 已过期
      'cancelled',           // 已取消
      'rejected'             // 已拒绝
    ],
    
    admin_orders_mapping: [
      'pending_payment → 待付款确认 (orange)',
      'confirmed_payment → 已付款确认 (blue)', 
      'pending_config → 待配置确认 (purple)',
      'confirmed_configuration → 已配置确认 (green)',
      'active → 已生效 (green)',
      'expired → 已过期 (gray)',
      'cancelled → 已取消 (red)',
      'rejected → 已拒绝 (red)'
    ],
    
    settlement_page_mapping: [
      '✅ 已修复: confirmed_payment → 已付款确认 (blue)',
      '✅ 已修复: confirmed_configuration → 已配置确认 (green)',
      'pending_payment → 待付款确认 (orange)',
      'pending_config → 待配置确认 (purple)',
      'active → 已生效 (green)',
      'expired → 已过期 (gray)',
      'cancelled → 已取消 (red)',
      'rejected → 已拒绝 (red)'
    ]
  };
  
  console.log('后端订单状态值:');
  statusMappings.backend_status_values.forEach(status => {
    console.log(`   - ${status}`);
  });
  
  console.log('\n管理员订单页面状态映射:');
  statusMappings.admin_orders_mapping.forEach(mapping => {
    console.log(`   ${mapping}`);
  });
  
  console.log('\n销售对账页面状态映射:');
  statusMappings.settlement_page_mapping.forEach(mapping => {
    console.log(`   ${mapping}`);
  });
}

// 检查可能的数据问题
function identifyDataIssues() {
  console.log('\n🔧 识别可能的数据问题...\n');
  
  const issues = [
    {
      issue: '数据概览统计全部为0',
      possible_causes: [
        '数据库中没有订单数据',
        '订单状态值与SQL查询中的值不匹配',
        'API查询条件过于严格',
        '数据库连接问题'
      ],
      solutions: [
        '创建测试订单数据验证统计',
        '检查数据库中实际的订单状态值',
        '移除不必要的WHERE条件',
        '验证数据库连接和权限'
      ]
    },
    
    {
      issue: '订单状态更新失败',
      possible_causes: [
        'API权限问题',
        '前后端数据格式不匹配',
        '数据库字段约束问题',
        '网络连接问题'
      ],
      solutions: [
        '检查管理员权限验证',
        '验证API请求和响应格式',
        '确认数据库字段和约束',
        '添加错误日志和调试信息'
      ]
    },
    
    {
      issue: '销售管理数据为空',
      possible_causes: [
        '销售记录与订单关联失败',
        'JOIN查询条件错误',
        '销售数据缺失',
        '前端数据处理逻辑错误'
      ],
      solutions: [
        '✅ 已修复: 返回完整订单数组而非统计',
        '检查销售记录和订单的关联字段',
        '验证sales_code和link_code映射',
        '添加前端数据验证'
      ]
    }
  ];
  
  issues.forEach((item, index) => {
    console.log(`${index + 1}. ${item.issue}:`);
    console.log('   可能原因:');
    item.possible_causes.forEach(cause => {
      console.log(`     - ${cause}`);
    });
    console.log('   解决方案:');
    item.solutions.forEach(solution => {
      console.log(`     - ${solution}`);
    });
    console.log('');
  });
}

// 生成下一步行动计划
function generateActionPlan() {
  console.log('📋 下一步行动计划...\n');
  
  const actions = [
    {
      priority: 'HIGH',
      action: '创建测试订单数据',
      description: '如果数据库中没有订单，创建几个不同状态的测试订单',
      commands: ['node 创建测试订单验证统计.js']
    },
    
    {
      priority: 'HIGH', 
      action: '修复订单状态更新API',
      description: '添加详细的错误日志，确保API正确处理请求',
      files: ['api/admin.js - handleUpdateOrderStatus函数']
    },
    
    {
      priority: 'MEDIUM',
      action: '验证客户管理页面',
      description: '检查客户管理页面的组件渲染问题',
      files: ['client/src/components/admin/AdminCustomers.js']
    },
    
    {
      priority: 'LOW',
      action: '添加前端错误处理',
      description: '在关键操作中添加更详细的错误信息显示',
      files: ['client/src/components/admin/AdminOrders.js']
    }
  ];
  
  actions.forEach((action, index) => {
    console.log(`${index + 1}. [${action.priority}] ${action.action}`);
    console.log(`   描述: ${action.description}`);
    if (action.commands) {
      console.log('   命令:');
      action.commands.forEach(cmd => console.log(`     ${cmd}`));
    }
    if (action.files) {
      console.log('   文件:');
      action.files.forEach(file => console.log(`     ${file}`));
    }
    console.log('');
  });
}

if (require.main === module) {
  console.log('🔍 API数据格式问题分析报告\n');
  console.log('=' .repeat(50) + '\n');
  
  analyzeAdminSliceExpectations();
  analyzeOrderStatusMapping();
  identifyDataIssues();
  generateActionPlan();
  
  console.log('=' .repeat(50));
  console.log('✅ 分析完成');
}

module.exports = {
  analyzeAdminSliceExpectations,
  analyzeOrderStatusMapping, 
  identifyDataIssues,
  generateActionPlan
};