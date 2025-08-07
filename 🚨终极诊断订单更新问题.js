/**
 * 终极诊断订单更新问题
 * 在浏览器控制台运行
 */

console.log('='.repeat(50));
console.log('🚨 终极诊断订单更新问题');
console.log('='.repeat(50));

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

async function diagnose() {
  // 1. 检查Supabase客户端
  console.log('\n📋 检查Supabase客户端:');
  if (window.supabaseClient) {
    console.log('✅ window.supabaseClient 存在');
  } else {
    console.log('❌ window.supabaseClient 不存在');
  }
  
  // 2. 获取测试订单
  console.log('\n📋 获取测试订单:');
  const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  const orders = await ordersResponse.json();
  if (!orders || orders.length === 0) {
    console.log('❌ 没有订单数据');
    return;
  }
  
  const testOrder = orders[0];
  console.log('测试订单:', {
    id: testOrder.id,
    id类型: typeof testOrder.id,
    order_number: testOrder.order_number,
    status: testOrder.status
  });
  
  // 3. 直接使用fetch API更新
  console.log('\n📋 方法1: 直接使用fetch API更新');
  const newStatus = testOrder.status === 'pending' ? 'confirmed_payment' : 'pending';
  
  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${testOrder.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: newStatus
    })
  });
  
  console.log('更新响应状态码:', updateResponse.status);
  const updateResult = await updateResponse.text();
  
  if (updateResponse.ok) {
    console.log('✅ 直接API更新成功！');
    try {
      const data = JSON.parse(updateResult);
      console.log('更新后的数据:', data);
    } catch (e) {
      console.log('响应内容:', updateResult);
    }
  } else {
    console.error('❌ 直接API更新失败:');
    console.error('错误内容:', updateResult);
    
    // 解析错误
    try {
      const errorObj = JSON.parse(updateResult);
      console.error('错误对象:', errorObj);
      
      if (errorObj.message) {
        console.error('错误消息:', errorObj.message);
        
        // 分析具体错误
        if (errorObj.message.includes('column')) {
          console.log('🔴 可能是字段名问题');
        }
        if (errorObj.message.includes('type')) {
          console.log('🔴 可能是数据类型问题');
        }
        if (errorObj.message.includes('constraint')) {
          console.log('🔴 可能是约束条件问题');
        }
      }
    } catch (e) {
      // 不是JSON格式的错误
    }
  }
  
  // 4. 使用不同的ID格式尝试
  console.log('\n📋 方法2: 尝试不同的ID格式');
  
  // 尝试字符串ID
  const updateResponse2 = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.'${testOrder.id}'`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: newStatus
    })
  });
  
  console.log('字符串ID更新响应:', updateResponse2.status);
  if (!updateResponse2.ok) {
    const error2 = await updateResponse2.text();
    console.error('字符串ID更新失败:', error2);
  } else {
    console.log('✅ 字符串ID格式更新成功！');
  }
  
  // 5. 检查是否有updated_at字段要求
  console.log('\n📋 方法3: 包含updated_at字段');
  const updateResponse3 = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${testOrder.id}`, {
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
  
  console.log('包含updated_at响应:', updateResponse3.status);
  if (!updateResponse3.ok) {
    const error3 = await updateResponse3.text();
    console.error('包含updated_at更新失败:', error3);
  } else {
    console.log('✅ 包含updated_at更新成功！');
  }
  
  // 6. 测试AdminAPI
  console.log('\n📋 方法4: 测试AdminAPI');
  if (window.adminAPI) {
    try {
      const result = await window.adminAPI.updateOrderStatus(testOrder.id, newStatus);
      console.log('✅ AdminAPI更新成功:', result);
    } catch (error) {
      console.error('❌ AdminAPI更新失败:');
      console.error('错误对象:', error);
      console.error('错误消息:', error.message || error);
      
      // 检查是否是Promise rejection
      if (error && error.toString) {
        console.error('错误字符串:', error.toString());
      }
    }
  }
  
  // 7. 检查Redux错误
  if (window.store) {
    const state = window.store.getState();
    console.log('\n📋 Redux状态:');
    console.log('最后的错误:', state.admin.error);
  }
}

// 执行诊断
diagnose().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('诊断完成！');
  console.log('='.repeat(50));
});
