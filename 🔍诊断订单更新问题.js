/**
 * 诊断订单状态更新问题
 * 在浏览器控制台运行
 */

console.log('='.repeat(50));
console.log('🔍 开始诊断订单状态更新问题');
console.log('='.repeat(50));

// 1. 获取第一个订单的ID用于测试
fetch('https://itvmeamoqthfqtkpubdv.supabase.co/rest/v1/orders?select=id,order_number,status&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
  }
})
.then(r => r.json())
.then(async (orders) => {
  if (!orders || orders.length === 0) {
    console.log('❌ 没有找到订单数据');
    return;
  }
  
  const testOrder = orders[0];
  console.log('\n📋 测试订单:', testOrder);
  console.log('订单ID:', testOrder.id);
  console.log('订单号:', testOrder.order_number);
  console.log('当前状态:', testOrder.status);
  
  // 2. 尝试直接通过Supabase API更新状态
  console.log('\n📋 测试直接更新订单状态...');
  
  const newStatus = testOrder.status === 'pending' ? 'confirmed_payment' : 'pending';
  
  const updateResponse = await fetch(`https://itvmeamoqthfqtkpubdv.supabase.co/rest/v1/orders?id=eq.${testOrder.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
  });
  
  console.log('更新响应状态码:', updateResponse.status);
  
  if (updateResponse.status === 200 || updateResponse.status === 204) {
    console.log('✅ 直接API更新成功！');
    const updatedData = await updateResponse.json();
    console.log('更新后的数据:', updatedData);
  } else {
    const errorText = await updateResponse.text();
    console.error('❌ 更新失败:', errorText);
    
    // 分析错误
    if (errorText.includes('permission') || errorText.includes('RLS')) {
      console.log('\n🔴 问题诊断：权限问题');
      console.log('解决方案：需要在Supabase控制台执行SQL禁用RLS或授予权限');
    } else if (errorText.includes('column') || errorText.includes('field')) {
      console.log('\n🔴 问题诊断：字段问题');
      console.log('可能updated_at字段不存在或类型不匹配');
    }
  }
  
  // 3. 测试通过AdminAPI更新
  console.log('\n📋 测试通过AdminAPI更新...');
  if (window.adminAPI) {
    try {
      const result = await window.adminAPI.updateOrderStatus(testOrder.id, newStatus);
      console.log('✅ AdminAPI更新成功:', result);
    } catch (error) {
      console.error('❌ AdminAPI更新失败:', error);
    }
  }
});

// 4. 检查Redux状态
if (window.store) {
  const state = window.store.getState();
  console.log('\n📋 Redux状态:');
  console.log('当前订单数:', state.admin.orders?.length || 0);
  console.log('Loading状态:', state.admin.loading);
  console.log('错误信息:', state.admin.error);
}
