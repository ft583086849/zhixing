/**
 * 🎯 快速验证配置确认功能
 * 在订单管理页面运行此脚本
 */

(async function() {
  console.clear();
  console.log('🎯 快速验证配置确认功能');
  console.log('='.repeat(50));
  
  // 1. 检查状态映射
  console.log('\n✅ 检查状态映射:');
  const expectedStatus = 'confirmed_config';
  console.log(`  目标状态: ${expectedStatus}`);
  console.log(`  字符长度: ${expectedStatus.length} (✓ 符合varchar(20))`);
  
  // 2. 查找配置确认按钮
  console.log('\n✅ 查找配置确认按钮:');
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('配置确认')
  );
  
  if (buttons.length > 0) {
    console.log(`  找到 ${buttons.length} 个配置确认按钮`);
    
    // 获取第一个按钮的订单信息
    const firstButton = buttons[0];
    const row = firstButton.closest('tr');
    const cells = row?.querySelectorAll('td');
    
    if (cells && cells.length > 0) {
      const orderNumber = cells[0]?.textContent;
      const status = cells[12]?.querySelector('.ant-tag')?.textContent;
      
      console.log(`\n  第一个订单:`);
      console.log(`    订单号: ${orderNumber}`);
      console.log(`    当前状态: ${status}`);
      
      // 模拟点击事件
      console.log('\n✅ 模拟点击测试:');
      console.log('  如需测试，请手动点击按钮');
      console.log('  或使用: updateOrderToConfirmed("订单ID")');
    }
  } else {
    console.log('  ⚠️ 没有找到配置确认按钮');
    console.log('  可能原因:');
    console.log('    - 没有待配置的订单');
    console.log('    - 页面还未加载完成');
  }
  
  // 3. 检查AdminAPI
  console.log('\n✅ 检查AdminAPI:');
  if (window.adminAPI && window.adminAPI.updateOrderStatus) {
    console.log('  AdminAPI.updateOrderStatus 可用');
    
    // 测试调用（不实际执行）
    console.log('  测试命令: adminAPI.updateOrderStatus("订单ID", "confirmed_config")');
  } else {
    console.log('  ⚠️ AdminAPI未加载');
  }
  
  // 4. 提供快速修复函数
  window.quickFix = function(orderId) {
    if (!orderId) {
      console.log('用法: quickFix("订单ID")');
      return;
    }
    
    console.log(`\n正在更新订单 ${orderId}...`);
    
    // 使用正确的状态值
    if (window.adminAPI && window.adminAPI.updateOrderStatus) {
      window.adminAPI.updateOrderStatus(orderId, 'confirmed_config')
        .then(result => {
          console.log('✅ 更新成功！', result);
          setTimeout(() => location.reload(), 2000);
        })
        .catch(error => {
          console.error('❌ 更新失败:', error);
        });
    } else {
      // 直接调用Supabase API
      const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
      
      fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
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
      })
      .then(response => response.json())
      .then(result => {
        console.log('✅ 直接API更新成功！', result);
        setTimeout(() => location.reload(), 2000);
      })
      .catch(error => {
        console.error('❌ 直接API更新失败:', error);
      });
    }
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 使用说明:');
  console.log('1. 点击页面上的"配置确认"按钮');
  console.log('2. 或使用: quickFix("订单ID")');
  console.log('3. 状态将更新为 confirmed_config (已完成)');
  console.log('='.repeat(50));
})();
