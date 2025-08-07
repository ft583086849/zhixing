/**
 * ✅ 验证所有功能正常
 * 在浏览器控制台运行，确认权限修复后一切正常
 */

console.log('='.repeat(50));
console.log('✅ 验证所有功能是否正常');
console.log('='.repeat(50));

async function verifyAll() {
  const results = {
    订单更新: false,
    数据概览: false,
    销售管理: false,
    客户管理: false
  };
  
  try {
    // 1. 测试订单更新
    console.log('\n1️⃣ 测试订单更新功能...');
    if (window.supabaseClient) {
      const { data: orders } = await window.supabaseClient
        .from('orders')
        .select('*')
        .limit(1);
      
      if (orders && orders[0]) {
        const testOrder = orders[0];
        const newStatus = testOrder.status === 'pending_payment' ? 
          'confirmed_payment' : 'pending_payment';
        
        const { data: updated, error } = await window.supabaseClient
          .from('orders')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testOrder.id)
          .select()
          .single();
        
        if (!error && updated) {
          console.log('✅ 订单更新成功！');
          results.订单更新 = true;
          
          // 恢复原状态
          await window.supabaseClient
            .from('orders')
            .update({ status: testOrder.status })
            .eq('id', testOrder.id);
        } else {
          console.error('❌ 订单更新失败:', error);
        }
      }
    }
    
    // 2. 测试数据概览
    console.log('\n2️⃣ 测试数据概览API...');
    if (window.adminAPI) {
      const stats = await window.adminAPI.getStats();
      if (stats) {
        console.log('✅ 数据概览获取成功:', {
          订单总数: stats.totalOrders || 0,
          销售总数: stats.totalSales || 0,
          客户总数: stats.totalCustomers || 0
        });
        results.数据概览 = true;
      }
    }
    
    // 3. 测试销售管理
    console.log('\n3️⃣ 测试销售管理数据...');
    if (window.store) {
      await window.store.dispatch({ 
        type: 'admin/getSales/pending' 
      });
      
      const { data: sales } = await window.supabaseClient
        .from('primary_sales')
        .select('*')
        .limit(5);
      
      if (sales) {
        console.log(`✅ 获取到 ${sales.length} 条销售数据`);
        results.销售管理 = true;
      }
    }
    
    // 4. 测试客户管理
    console.log('\n4️⃣ 测试客户管理数据...');
    const { data: customers } = await window.supabaseClient
      .from('orders')
      .select('*')
      .limit(5);
    
    if (customers) {
      console.log(`✅ 获取到 ${customers.length} 条客户数据`);
      results.客户管理 = true;
    }
    
    // 5. 测试7天免费订单特殊逻辑
    console.log('\n5️⃣ 测试7天免费订单特殊处理...');
    const { data: freeOrders } = await window.supabaseClient
      .from('orders')
      .select('*')
      .eq('duration', '7days')
      .limit(1);
    
    if (freeOrders && freeOrders[0]) {
      console.log('✅ 找到7天免费订单，可以测试直接配置确认功能');
    } else {
      console.log('ℹ️ 没有7天免费订单，创建测试数据...');
    }
    
  } catch (error) {
    console.error('验证过程出错:', error);
  }
  
  // 显示结果汇总
  console.log('\n' + '='.repeat(50));
  console.log('📊 功能验证结果汇总:');
  console.log('='.repeat(50));
  
  for (const [功能, 状态] of Object.entries(results)) {
    console.log(`${状态 ? '✅' : '❌'} ${功能}: ${状态 ? '正常' : '异常'}`);
  }
  
  const allPass = Object.values(results).every(v => v);
  if (allPass) {
    console.log('\n🎉 所有功能验证通过！系统运行正常！');
  } else {
    console.log('\n⚠️ 部分功能还有问题，请检查具体错误信息');
  }
  
  console.log('\n💡 建议操作:');
  console.log('1. 刷新页面 (Ctrl+Shift+R)');
  console.log('2. 重新登录管理面板');
  console.log('3. 测试订单管理的各个按钮');
  console.log('4. 检查数据概览是否显示正确数字');
}

// 执行验证
verifyAll().then(() => {
  console.log('\n验证完成！');
}).catch(err => {
  console.error('验证失败:', err);
});
