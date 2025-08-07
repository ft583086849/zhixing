/**
 * 🔧 修复订单状态字段长度问题
 * 
 * 问题根源：
 * - 数据库 status 字段限制为 varchar(20)
 * - "confirmed_configuration" 有 21 个字符，超过限制
 * - 需要改为 "confirmed_config" (16个字符)
 * 
 * 在浏览器控制台运行此脚本测试修复
 */

console.clear();
console.log('='.repeat(60));
console.log('🔧 修复订单状态长度问题');
console.log('='.repeat(60));

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

async function testStatusUpdate() {
  console.log('\n📋 步骤1: 获取测试订单');
  console.log('-'.repeat(50));
  
  // 获取一个待配置的订单
  const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending_config&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  const orders = await ordersResponse.json();
  
  if (!orders || orders.length === 0) {
    console.log('⚠️ 没有找到待配置的订单');
    console.log('尝试获取任何订单进行测试...');
    
    const allOrdersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    const allOrders = await allOrdersResponse.json();
    if (!allOrders || allOrders.length === 0) {
      console.log('❌ 没有订单数据');
      return;
    }
    orders[0] = allOrders[0];
  }
  
  const testOrder = orders[0];
  console.log('找到测试订单:', {
    id: testOrder.id,
    order_number: testOrder.order_number,
    current_status: testOrder.status,
    status_length: testOrder.status ? testOrder.status.length : 0
  });
  
  console.log('\n📋 步骤2: 测试状态长度');
  console.log('-'.repeat(50));
  
  const statusesToTest = [
    { value: 'confirmed_configuration', length: 21, valid: false },
    { value: 'confirmed_config', length: 16, valid: true },
    { value: 'pending_config', length: 14, valid: true },
    { value: 'confirmed_payment', length: 17, valid: true }
  ];
  
  console.log('状态字符串长度检查:');
  statusesToTest.forEach(status => {
    const icon = status.valid ? '✅' : '❌';
    console.log(`${icon} ${status.value}: ${status.length}个字符 ${status.valid ? '(符合varchar(20))' : '(超过限制!)'}`);
  });
  
  console.log('\n📋 步骤3: 使用正确的状态值更新订单');
  console.log('-'.repeat(50));
  
  // 使用 confirmed_config 替代 confirmed_configuration
  const newStatus = 'confirmed_config'; // 只有16个字符，符合限制
  
  console.log(`更新订单 ${testOrder.id} 的状态为: ${newStatus}`);
  
  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${testOrder.id}`, {
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
  
  console.log('响应状态码:', updateResponse.status);
  
  if (updateResponse.ok) {
    const updatedOrder = await updateResponse.json();
    console.log('✅ 状态更新成功！');
    console.log('更新后的订单:', updatedOrder[0] || updatedOrder);
  } else {
    const errorText = await updateResponse.text();
    console.error('❌ 更新失败:', errorText);
    
    // 分析错误
    if (errorText.includes('character varying')) {
      console.error('🔴 仍然是字段长度问题，请确认数据库字段定义');
    }
  }
  
  console.log('\n📋 步骤4: 验证页面操作');
  console.log('-'.repeat(50));
  
  // 查找页面上的配置确认按钮
  const configButtons = document.querySelectorAll('button');
  let foundButton = false;
  
  configButtons.forEach(button => {
    if (button.textContent.includes('配置确认')) {
      foundButton = true;
      console.log('找到配置确认按钮');
      
      // 获取按钮的onclick事件
      const onclickStr = button.getAttribute('onclick') || '';
      if (onclickStr.includes('confirmed_configuration')) {
        console.log('⚠️ 按钮仍在使用 confirmed_configuration');
        console.log('需要更新为 confirmed_config');
      } else {
        console.log('✅ 按钮已使用正确的状态值');
      }
    }
  });
  
  if (!foundButton) {
    console.log('未找到配置确认按钮（可能不在订单管理页面）');
  }
  
  // 检查Redux中的状态映射
  if (window.store) {
    console.log('\n📋 步骤5: 检查Redux状态映射');
    console.log('-'.repeat(50));
    
    const state = window.store.getState();
    console.log('当前Redux state:', {
      hasAdmin: !!state.admin,
      hasOrders: !!state.orders,
      error: state.admin?.error || state.orders?.error
    });
  }
}

// 提供修复建议
function showFixSuggestions() {
  console.log('\n' + '='.repeat(60));
  console.log('💡 修复建议');
  console.log('='.repeat(60));
  
  console.log('\n1. 立即修复方案:');
  console.log('   - 将所有 "confirmed_configuration" 改为 "confirmed_config"');
  console.log('   - 确保状态映射中使用 confirmed_config');
  console.log('   - 更新按钮点击事件传递的状态值');
  
  console.log('\n2. 需要修改的关键文件:');
  console.log('   - client/src/components/admin/AdminOrders.js');
  console.log('   - client/src/services/api.js');
  console.log('   - client/src/services/supabase.js');
  console.log('   - client/src/constants/index.js');
  
  console.log('\n3. 数据库兼容性:');
  console.log('   - confirmed_config: 16个字符 ✅');
  console.log('   - pending_config: 14个字符 ✅');
  console.log('   - confirmed_payment: 17个字符 ✅');
  console.log('   - 所有状态都在varchar(20)限制内');
  
  console.log('\n4. 测试步骤:');
  console.log('   - 刷新页面');
  console.log('   - 找到待配置的订单');
  console.log('   - 点击"配置确认"按钮');
  console.log('   - 状态应成功更新为"已完成"');
}

// 执行测试
testStatusUpdate().then(() => {
  showFixSuggestions();
  console.log('\n' + '='.repeat(60));
  console.log('✅ 诊断完成！');
  console.log('='.repeat(60));
}).catch(error => {
  console.error('❌ 执行出错:', error);
});
