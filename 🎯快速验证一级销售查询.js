// 🎯 快速验证一级销售查询功能
// 在 https://zhixing-seven.vercel.app/primary-sales-settlement 页面控制台运行

console.log('🎯 开始验证一级销售查询功能...');
console.log('='.repeat(50));

async function quickVerify() {
  const targetWechat = '870501';
  console.log(`📱 目标微信号: ${targetWechat}`);
  
  // 1. 检查Supabase客户端
  const supabase = window.supabaseClient || window.supabase;
  if (!supabase) {
    console.error('❌ Supabase客户端未找到');
    return;
  }
  console.log('✅ Supabase客户端已加载');
  
  // 2. 查询一级销售
  console.log('\n📊 查询一级销售数据...');
  const { data: primarySales, error: salesError } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', targetWechat)
    .single();
  
  if (salesError) {
    console.error('❌ 查询失败:', salesError);
    return;
  }
  
  console.log('✅ 找到一级销售:');
  console.log(`  - ID: ${primarySales.id}`);
  console.log(`  - 微信号: ${primarySales.wechat_name}`);
  console.log(`  - 销售代码: ${primarySales.sales_code}`);
  console.log(`  - 姓名: ${primarySales.name || '未设置'}`);
  
  // 3. 查询二级销售
  console.log('\n👥 查询二级销售...');
  const { data: secondarySales, error: secError } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('primary_sales_id', primarySales.id);
  
  if (secError) {
    console.error('⚠️ 查询二级销售失败:', secError);
  } else {
    console.log(`✅ 找到 ${secondarySales?.length || 0} 个二级销售`);
    if (secondarySales && secondarySales.length > 0) {
      secondarySales.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.wechat_name} (${s.sales_code})`);
      });
    }
  }
  
  // 4. 查询订单
  console.log('\n📦 查询相关订单...');
  
  // 收集所有相关的sales_code
  let allSalesCodes = [primarySales.sales_code];
  if (secondarySales && secondarySales.length > 0) {
    const secondaryCodes = secondarySales.map(s => s.sales_code);
    allSalesCodes = [...allSalesCodes, ...secondaryCodes];
  }
  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .in('sales_code', allSalesCodes);
  
  if (ordersError) {
    console.error('⚠️ 查询订单失败:', ordersError);
  } else {
    console.log(`✅ 找到 ${orders?.length || 0} 个相关订单`);
    
    if (orders && orders.length > 0) {
      // 统计订单
      const confirmedOrders = orders.filter(o => o.config_confirmed === true);
      const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const totalCommission = confirmedOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
      
      console.log('\n📈 订单统计:');
      console.log(`  - 总订单数: ${orders.length}`);
      console.log(`  - 已确认订单: ${confirmedOrders.length}`);
      console.log(`  - 总金额: $${totalAmount.toFixed(2)}`);
      console.log(`  - 总佣金: $${totalCommission.toFixed(2)}`);
    }
  }
  
  // 5. 自动填充表单并提示
  console.log('\n🔧 自动填充查询表单...');
  const wechatInput = document.querySelector('input[placeholder*="微信号"]');
  const queryButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('查询')
  );
  
  if (wechatInput && queryButton) {
    wechatInput.value = targetWechat;
    wechatInput.dispatchEvent(new Event('input', { bubbles: true }));
    wechatInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ 已填充微信号');
    console.log('💡 请点击查询按钮或执行: queryButton.click()');
    
    // 暴露给全局
    window.queryButton = queryButton;
    window.autoQuery = () => queryButton.click();
  } else {
    console.log('⚠️ 未找到查询表单');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 验证完成！');
  console.log('💡 执行 autoQuery() 自动查询');
}

// 运行验证
quickVerify().catch(err => {
  console.error('❌ 验证过程出错:', err);
});

// 导出函数
window.quickVerify = quickVerify;
