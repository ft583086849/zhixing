/**
 * 测试订单状态更新修复
 * 在浏览器控制台运行此脚本
 */

console.log('='.repeat(50));
console.log('🚀 订单状态映射更新测试');
console.log('='.repeat(50));

// 状态映射配置
const statusConfig = {
  // 标准化状态映射
  statusMap: {
    // 主流程状态
    'pending_payment': '待付款',
    'pending_review': '待付款', // 兼容旧状态
    'pending': '待付款', // 兼容旧状态
    'confirmed': '已付款', // 兼容旧状态
    'confirmed_payment': '已付款',
    'pending_config': '待配置',
    'confirmed_config': '已完成', // 标准状态，限制在20字符内
    
    // 特殊状态
    'active': '已生效',
    'expired': '已过期',
    'cancelled': '已取消',
    'refunded': '已退款',
    'rejected': '已拒绝'
  },
  
  // 状态流转规则
  transitions: {
    'pending_payment': ['confirmed_payment', 'cancelled', 'rejected'],
    'confirmed_payment': ['pending_config', 'cancelled', 'refunded'],
    'pending_config': ['confirmed_config', 'cancelled', 'refunded'],
    'confirmed_config': [], // 终态
    'cancelled': [], // 终态
    'refunded': [], // 终态
    'rejected': [] // 终态
  },
  
  // 7天免费订单特殊流程
  freeTrialFlow: {
    initial: 'pending_config', // 直接进入待配置状态
    skipStates: ['pending_payment', 'confirmed_payment'] // 跳过的状态
  }
};

// 测试函数
function testStatusMapping() {
  console.log('\n📋 1. 测试状态映射:');
  Object.entries(statusConfig.statusMap).forEach(([en, cn]) => {
    console.log(`   ${en} → ${cn}`);
  });
  
  console.log('\n📋 2. 测试7天免费订单流程:');
  const freeOrder = {
    id: 'TEST_001',
    duration: '7days',
    status: 'pending_payment'
  };
  
  console.log('   初始状态:', freeOrder.status);
  console.log('   应显示为: 待配置');
  console.log('   可执行操作: 配置确认');
  console.log('   目标状态: confirmed_config');  
  
  console.log('\n📋 3. 测试付费订单流程:');
  const paidOrder = {
    id: 'TEST_002',
    duration: '1month',
    status: 'pending_payment'
  };
  
  console.log('   流程: pending_payment → confirmed_payment → pending_config → confirmed_config');
  console.log('   每步操作:');
  console.log('     1. 付款确认 (pending_payment → confirmed_payment)');
  console.log('     2. 开始配置 (confirmed_payment → pending_config)');
  console.log('     3. 配置确认 (pending_config → confirmed_config)');
}

// 检查页面状态
function checkPageStatus() {
  console.log('\n📋 4. 检查页面显示:');
  
  // 查找订单表格
  const statusCells = document.querySelectorAll('[data-row-key] td:nth-child(13)'); // 状态列
  if (statusCells.length > 0) {
    console.log(`   找到 ${statusCells.length} 个订单`);
    
    // 检查前5个订单的状态显示
    Array.from(statusCells).slice(0, 5).forEach((cell, index) => {
      const tag = cell.querySelector('.ant-tag');
      if (tag) {
        console.log(`   订单${index + 1}: ${tag.textContent}`);
      }
    });
    
    // 检查是否还有英文状态列
    const englishStatusHeader = Array.from(document.querySelectorAll('th')).find(th => 
      th.textContent.includes('状态(英文)')
    );
    
    if (englishStatusHeader) {
      console.log('   ⚠️ 英文状态列仍然存在，需要刷新页面');
    } else {
      console.log('   ✅ 英文状态列已移除');
    }
  } else {
    console.log('   未找到订单表格，请确保在订单管理页面');
  }
}

// 执行测试
testStatusMapping();
checkPageStatus();

console.log('\n' + '='.repeat(50));
console.log('💡 提示:');
console.log('1. 状态映射已更新，去掉了英文后缀');
console.log('2. 7天免费订单跳过付款流程，直接进入待配置');
console.log('3. 请刷新页面查看最新效果');
console.log('='.repeat(50));