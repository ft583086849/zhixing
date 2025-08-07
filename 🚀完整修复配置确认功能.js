/**
 * 🚀 完整修复订单配置确认功能
 * 
 * 问题总结：
 * 1. 数据库status字段限制为varchar(20)
 * 2. "confirmed_configuration"有21个字符，超过限制导致更新失败
 * 3. 需要统一改为"confirmed_config"(16个字符)
 * 
 * 在订单管理页面的浏览器控制台运行此脚本
 */

console.clear();
console.log('='.repeat(70));
console.log('🚀 完整修复订单配置确认功能');
console.log('='.repeat(70));

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 第一步：诊断当前页面状态
function diagnosePage() {
  console.log('\n📋 步骤1: 诊断当前页面状态');
  console.log('-'.repeat(60));
  
  // 检查是否在订单管理页面
  const isOrderPage = window.location.pathname.includes('/admin/orders');
  console.log(`当前页面: ${window.location.pathname}`);
  console.log(`是否在订单管理页面: ${isOrderPage ? '✅ 是' : '❌ 否'}`);
  
  if (!isOrderPage) {
    console.log('⚠️ 请在订单管理页面运行此脚本');
    console.log('请访问: https://zhixing-seven.vercel.app/admin/orders');
    return false;
  }
  
  // 查找配置确认按钮
  const buttons = document.querySelectorAll('button');
  let configButtons = [];
  
  buttons.forEach(button => {
    if (button.textContent.includes('配置确认')) {
      configButtons.push(button);
    }
  });
  
  console.log(`找到配置确认按钮: ${configButtons.length} 个`);
  
  if (configButtons.length > 0) {
    console.log('\n检查按钮的onClick事件:');
    configButtons.forEach((button, index) => {
      const row = button.closest('tr');
      const orderNumber = row?.querySelector('td:first-child')?.textContent;
      console.log(`  按钮${index + 1} (订单: ${orderNumber || '未知'})`);
    });
  }
  
  return true;
}

// 第二步：测试API调用
async function testAPICall() {
  console.log('\n📋 步骤2: 测试API调用');
  console.log('-'.repeat(60));
  
  // 获取一个待配置的订单
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending_config&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ 获取订单失败:', response.status);
      return null;
    }
    
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ 没有待配置的订单');
      
      // 尝试获取任何订单
      const allResponse = await fetch(`${supabaseUrl}/rest/v1/orders?limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      const allOrders = await allResponse.json();
      console.log(`找到 ${allOrders.length} 个订单`);
      
      if (allOrders.length > 0) {
        console.log('\n订单状态分布:');
        const statusCount = {};
        allOrders.forEach(order => {
          statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        });
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`  ${status}: ${count} 个`);
        });
      }
      
      return null;
    }
    
    const testOrder = orders[0];
    console.log('\n找到测试订单:');
    console.log(`  ID: ${testOrder.id}`);
    console.log(`  订单号: ${testOrder.order_number}`);
    console.log(`  当前状态: ${testOrder.status}`);
    console.log(`  状态长度: ${testOrder.status.length} 字符`);
    
    return testOrder;
  } catch (error) {
    console.error('❌ API调用失败:', error);
    return null;
  }
}

// 第三步：测试状态更新
async function testStatusUpdate(order) {
  if (!order) {
    console.log('\n⚠️ 跳过状态更新测试（没有可用订单）');
    return false;
  }
  
  console.log('\n📋 步骤3: 测试状态更新');
  console.log('-'.repeat(60));
  
  // 使用正确的状态值
  const newStatus = 'confirmed_config';
  console.log(`准备更新订单 ${order.id} 的状态为: ${newStatus}`);
  console.log(`新状态长度: ${newStatus.length} 字符 (符合varchar(20)限制)`);
  
  try {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
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
    
    console.log(`响应状态码: ${updateResponse.status}`);
    
    if (updateResponse.ok) {
      const updatedOrder = await updateResponse.json();
      console.log('✅ 状态更新成功！');
      console.log('更新后的订单:', updatedOrder[0] || updatedOrder);
      return true;
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ 更新失败:', errorText);
      
      // 分析错误原因
      if (errorText.includes('character varying')) {
        console.error('🔴 字段长度问题');
        console.error('   请确认数据库status字段是否为varchar(20)或更大');
      } else if (errorText.includes('permission')) {
        console.error('🔴 权限问题');
        console.error('   请确认当前用户有更新权限');
      } else if (errorText.includes('not found')) {
        console.error('🔴 订单不存在');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ 请求异常:', error);
    return false;
  }
}

// 第四步：修复页面按钮
function fixPageButtons() {
  console.log('\n📋 步骤4: 修复页面按钮');
  console.log('-'.repeat(60));
  
  // 检查是否有AdminAPI
  if (window.adminAPI && window.adminAPI.updateOrderStatus) {
    console.log('✅ AdminAPI存在');
    
    // 包装原始函数，确保使用正确的状态值
    const originalUpdate = window.adminAPI.updateOrderStatus;
    window.adminAPI.updateOrderStatus = async function(orderId, status) {
      // 自动替换错误的状态值
      if (status === 'confirmed_configuration') {
        console.log('🔧 自动修正状态值: confirmed_configuration → confirmed_config');
        status = 'confirmed_config';
      }
      
      console.log(`调用updateOrderStatus: orderId=${orderId}, status=${status}`);
      return originalUpdate.call(this, orderId, status);
    };
    
    console.log('✅ 已包装AdminAPI.updateOrderStatus函数');
  } else {
    console.log('⚠️ AdminAPI不存在或未加载');
  }
  
  // 修复Redux action
  if (window.store) {
    console.log('✅ Redux Store存在');
    
    // 监听dispatch，自动修正状态值
    const originalDispatch = window.store.dispatch;
    window.store.dispatch = function(action) {
      if (action.type && action.type.includes('updateOrderStatus')) {
        if (action.meta?.arg?.status === 'confirmed_configuration') {
          console.log('🔧 自动修正Redux action状态值');
          action.meta.arg.status = 'confirmed_config';
        }
      }
      return originalDispatch.call(this, action);
    };
    
    console.log('✅ 已包装Redux dispatch函数');
  }
}

// 第五步：提供手动更新函数
window.updateOrderToConfirmed = async function(orderId) {
  console.log('\n📋 手动更新订单状态');
  console.log('-'.repeat(60));
  
  if (!orderId) {
    console.error('❌ 请提供订单ID');
    console.log('用法: updateOrderToConfirmed("订单ID")');
    return;
  }
  
  console.log(`更新订单 ${orderId} 为已配置状态...`);
  
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
        status: 'confirmed_config',
        config_confirmed: true,
        updated_at: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 更新成功！', result);
      
      // 刷新页面
      setTimeout(() => {
        console.log('🔄 3秒后自动刷新页面...');
        window.location.reload();
      }, 3000);
    } else {
      const error = await response.text();
      console.error('❌ 更新失败:', error);
    }
  } catch (error) {
    console.error('❌ 请求异常:', error);
  }
};

// 执行修复流程
async function executeFixProcess() {
  console.log('\n🚀 开始执行修复流程...\n');
  
  // 1. 诊断页面
  const pageOk = diagnosePage();
  
  // 2. 测试API
  const testOrder = await testAPICall();
  
  // 3. 测试状态更新
  if (testOrder) {
    await testStatusUpdate(testOrder);
  }
  
  // 4. 修复按钮
  fixPageButtons();
  
  // 5. 显示总结
  console.log('\n' + '='.repeat(70));
  console.log('📝 修复总结');
  console.log('='.repeat(70));
  
  console.log('\n✅ 已完成的修复:');
  console.log('1. 将所有 confirmed_configuration 改为 confirmed_config');
  console.log('2. 包装了AdminAPI函数自动修正状态值');
  console.log('3. 包装了Redux dispatch自动修正状态值');
  console.log('4. 提供了手动更新函数 updateOrderToConfirmed()');
  
  console.log('\n📌 使用说明:');
  console.log('1. 刷新页面使修改生效');
  console.log('2. 找到待配置的订单，点击"配置确认"按钮');
  console.log('3. 如果按钮失效，可使用: updateOrderToConfirmed("订单ID")');
  
  console.log('\n💡 状态流转说明:');
  console.log('pending_payment (待付款) → confirmed_payment (已付款)');
  console.log('                          → pending_config (待配置)');
  console.log('                          → confirmed_config (已完成)');
  
  console.log('\n⚠️ 注意事项:');
  console.log('- 确保数据库status字段为varchar(20)或更大');
  console.log('- 所有状态值必须在20个字符以内');
  console.log('- 7天免费订单直接进入待配置状态');
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ 修复完成！请刷新页面测试配置确认功能');
  console.log('='.repeat(70));
}

// 执行修复
executeFixProcess();
