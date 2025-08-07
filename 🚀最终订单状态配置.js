/**
 * 🚀 最终订单状态配置
 * 
 * 功能说明：
 * 1. 修复 confirmed_configuration → confirmed_config (解决varchar(20)限制)
 * 2. 添加 incomplete (未完成购买) 作为独立订单状态
 * 3. 正确的状态流转逻辑
 */

console.clear();
console.log('='.repeat(70));
console.log('🚀 最终订单状态配置');
console.log('='.repeat(70));

// 所有订单状态
const orderStatuses = {
  // 主流程状态
  'pending_payment': { 
    name: '待付款', 
    color: 'orange',
    length: 15,
    description: '等待客户付款'
  },
  'confirmed_payment': { 
    name: '已付款', 
    color: 'blue',
    length: 17,
    description: '付款已确认'
  },
  'pending_config': { 
    name: '待配置', 
    color: 'purple',
    length: 14,
    description: '等待配置确认'
  },
  'confirmed_config': { 
    name: '已完成', 
    color: 'green',
    length: 16,
    description: '配置已确认，订单完成'
  },
  
  // 特殊状态
  'incomplete': { 
    name: '未完成购买', 
    color: 'gray',
    length: 10,
    description: '客户未完成购买流程'
  },
  'active': { 
    name: '已生效', 
    color: 'green',
    length: 6,
    description: '订单已生效'
  },
  'expired': { 
    name: '已过期', 
    color: 'gray',
    length: 7,
    description: '订单已过期'
  },
  'cancelled': { 
    name: '已取消', 
    color: 'red',
    length: 9,
    description: '订单已取消'
  },
  'rejected': { 
    name: '已拒绝', 
    color: 'red',
    length: 8,
    description: '订单被拒绝'
  }
};

// 状态流转规则
const stateTransitions = {
  'pending_payment': [
    { action: '付款确认', nextState: 'confirmed_payment' },
    { action: '拒绝订单', nextState: 'rejected' }
  ],
  'confirmed_payment': [
    { action: '开始配置', nextState: 'pending_config' },
    { action: '拒绝订单', nextState: 'rejected' }
  ],
  'pending_config': [
    { action: '配置确认', nextState: 'confirmed_config' },
    { action: '拒绝订单', nextState: 'rejected' }
  ],
  'confirmed_config': [], // 终态
  'incomplete': [],       // 终态
  'active': [],          // 终态
  'expired': [],         // 终态
  'cancelled': [],       // 终态
  'rejected': []         // 终态
};

// 显示所有状态
console.log('\n📊 所有订单状态');
console.log('-'.repeat(60));
console.table(Object.entries(orderStatuses).map(([key, value]) => ({
  '状态值': key,
  '显示名称': value.name,
  '字符长度': value.length + '/20',
  '颜色': value.color,
  '说明': value.description
})));

// 显示状态流转
console.log('\n📋 状态流转规则');
console.log('-'.repeat(60));

Object.entries(stateTransitions).forEach(([state, transitions]) => {
  const stateInfo = orderStatuses[state];
  console.log(`\n${stateInfo.name} (${state})`);
  
  if (transitions.length > 0) {
    transitions.forEach(trans => {
      const nextStateInfo = orderStatuses[trans.nextState];
      console.log(`  ├─→ ${trans.action} → ${nextStateInfo.name}`);
    });
  } else {
    console.log('  └─ 终态（无后续操作）');
  }
});

// 特殊说明
console.log('\n💡 特殊说明');
console.log('-'.repeat(60));
console.log('1. 7天免费订单：自动跳过付款流程，直接进入待配置状态');
console.log('2. 未完成购买：是独立的订单状态，表示客户未完成购买流程');
console.log('3. 所有状态值都在 varchar(20) 限制内');

// 验证函数
window.verifyOrderStatus = function() {
  console.log('\n🔍 验证当前页面状态');
  console.log('-'.repeat(60));
  
  // 检查是否在订单管理页面
  const isOrderPage = window.location.pathname.includes('/admin/orders');
  console.log(`当前页面: ${window.location.pathname}`);
  console.log(`是否在订单管理页面: ${isOrderPage ? '✅' : '❌'}`);
  
  if (!isOrderPage) {
    console.log('请访问: https://zhixing-seven.vercel.app/admin/orders');
    return;
  }
  
  // 查找所有状态标签
  const statusTags = document.querySelectorAll('.ant-tag');
  const statusCount = {};
  
  statusTags.forEach(tag => {
    const status = tag.textContent;
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  console.log('\n订单状态分布:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 个`);
  });
  
  // 查找操作按钮
  const buttons = document.querySelectorAll('button');
  const buttonTypes = new Set();
  
  buttons.forEach(button => {
    const text = button.textContent.trim();
    if (text && !text.includes('筛选') && !text.includes('导出')) {
      buttonTypes.add(text);
    }
  });
  
  console.log('\n可用操作按钮:');
  Array.from(buttonTypes).forEach(type => {
    console.log(`  - ${type}`);
  });
};

console.log('\n' + '='.repeat(70));
console.log('✅ 配置完成！');
console.log('运行 verifyOrderStatus() 验证页面状态');
console.log('='.repeat(70));
