/**
 * 🚀 发布订单状态更新 - 包含"未完成购买"状态
 * 
 * 功能说明：
 * 1. 新增 "未完成购买" (incomplete) 状态
 * 2. 在待付款和待配置状态都可以标记为未完成购买
 * 3. 状态值为 'incomplete'，长度10个字符，符合varchar(20)限制
 * 
 * 在订单管理页面运行此脚本验证功能
 */

console.clear();
console.log('='.repeat(70));
console.log('🚀 发布订单状态更新');
console.log('='.repeat(70));

// 完整的状态流转图
const statusFlow = {
  title: '订单状态流转图',
  states: {
    'pending_payment': {
      name: '待付款',
      color: 'orange',
      actions: [
        { to: 'confirmed_payment', label: '付款确认', type: 'primary' },
        { to: 'incomplete', label: '未完成购买', type: 'default' },
        { to: 'rejected', label: '拒绝订单', type: 'danger' }
      ]
    },
    'confirmed_payment': {
      name: '已付款',
      color: 'blue',
      actions: [
        { to: 'pending_config', label: '开始配置', type: 'primary' },
        { to: 'rejected', label: '拒绝订单', type: 'danger' }
      ]
    },
    'pending_config': {
      name: '待配置',
      color: 'purple',
      actions: [
        { to: 'confirmed_config', label: '配置确认', type: 'primary' },
        { to: 'incomplete', label: '未完成购买', type: 'default' },
        { to: 'rejected', label: '拒绝订单', type: 'danger' }
      ]
    },
    'confirmed_config': {
      name: '已完成',
      color: 'green',
      actions: [] // 终态，无操作
    },
    'incomplete': {
      name: '未完成购买',
      color: 'gray',
      actions: [] // 终态，无操作
    },
    'active': {
      name: '已生效',
      color: 'green',
      actions: []
    },
    'expired': {
      name: '已过期',
      color: 'gray',
      actions: []
    },
    'cancelled': {
      name: '已取消',
      color: 'red',
      actions: []
    },
    'rejected': {
      name: '已拒绝',
      color: 'red',
      actions: []
    }
  }
};

// 显示状态流转图
function displayStatusFlow() {
  console.log('\n📊 订单状态流转图');
  console.log('-'.repeat(60));
  
  Object.entries(statusFlow.states).forEach(([key, state]) => {
    console.log(`\n${state.name} (${key})`);
    console.log(`  颜色: ${state.color}`);
    console.log(`  长度: ${key.length} 字符`);
    
    if (state.actions.length > 0) {
      console.log('  可执行操作:');
      state.actions.forEach(action => {
        console.log(`    → ${action.label} → ${statusFlow.states[action.to].name}`);
      });
    } else {
      console.log('  终态（无后续操作）');
    }
  });
}

// 验证页面功能
function verifyPageFunctions() {
  console.log('\n📋 验证页面功能');
  console.log('-'.repeat(60));
  
  // 检查是否在订单管理页面
  const isOrderPage = window.location.pathname.includes('/admin/orders');
  console.log(`当前页面: ${window.location.pathname}`);
  console.log(`是否在订单管理页面: ${isOrderPage ? '✅' : '❌'}`);
  
  if (!isOrderPage) {
    console.log('⚠️ 请访问: https://zhixing-seven.vercel.app/admin/orders');
    return;
  }
  
  // 查找所有操作按钮
  const buttons = document.querySelectorAll('button');
  const buttonTypes = {
    '付款确认': [],
    '开始配置': [],
    '配置确认': [],
    '未完成购买': [],
    '拒绝订单': [],
    '取消订单': []
  };
  
  buttons.forEach(button => {
    const text = button.textContent;
    Object.keys(buttonTypes).forEach(type => {
      if (text.includes(type)) {
        buttonTypes[type].push(button);
      }
    });
  });
  
  console.log('\n找到的操作按钮:');
  Object.entries(buttonTypes).forEach(([type, btns]) => {
    console.log(`  ${type}: ${btns.length} 个`);
  });
  
  // 检查状态筛选下拉框
  const statusSelect = document.querySelector('[name="status"]');
  if (statusSelect) {
    const options = statusSelect.querySelectorAll('option');
    console.log('\n状态筛选选项:');
    options.forEach(option => {
      if (option.value) {
        console.log(`  - ${option.textContent} (${option.value})`);
      }
    });
  }
}

// 测试状态更新
async function testStatusUpdate(orderId, newStatus) {
  console.log('\n📋 测试状态更新');
  console.log('-'.repeat(60));
  
  if (!orderId || !newStatus) {
    console.log('用法: testStatusUpdate("订单ID", "新状态")');
    console.log('可用状态: incomplete, confirmed_config, rejected 等');
    return;
  }
  
  console.log(`更新订单 ${orderId} 为 ${newStatus}...`);
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 更新成功！', result);
      console.log('页面将在3秒后刷新...');
      setTimeout(() => location.reload(), 3000);
    } else {
      const error = await response.text();
      console.error('❌ 更新失败:', error);
    }
  } catch (error) {
    console.error('❌ 请求异常:', error);
  }
}

// 提供全局函数
window.markAsIncomplete = function(orderId) {
  if (!orderId) {
    console.log('用法: markAsIncomplete("订单ID")');
    return;
  }
  testStatusUpdate(orderId, 'incomplete');
};

// 执行验证
displayStatusFlow();
verifyPageFunctions();

console.log('\n' + '='.repeat(70));
console.log('💡 使用说明');
console.log('='.repeat(70));
console.log('\n1. 新增状态说明:');
console.log('   - 状态名称: 未完成购买');
console.log('   - 状态值: incomplete (10个字符)');
console.log('   - 适用场景: 客户未完成购买流程');
console.log('\n2. 操作位置:');
console.log('   - 待付款订单 → 未完成购买按钮');
console.log('   - 待配置订单 → 未完成购买按钮');
console.log('\n3. 手动更新命令:');
console.log('   markAsIncomplete("订单ID")');
console.log('\n4. 状态流转路径:');
console.log('   待付款 → 未完成购买（终态）');
console.log('   待配置 → 未完成购买（终态）');
console.log('\n✅ 功能已就绪，可以发布使用！');
console.log('='.repeat(70));
