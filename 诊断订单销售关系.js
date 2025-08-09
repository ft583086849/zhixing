// 🔍 诊断订单和客户管理的销售关系差异
// 在管理员后台控制台运行

console.log('🔍 开始诊断订单销售关系问题...\n');
console.log('='.repeat(50));

async function diagnoseSalesRelationship() {
  try {
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    // 1. 查找fl261247相关的所有数据
    console.log('\n1️⃣ 查找fl261247相关的所有记录...\n');
    
    // 查找fl261247作为销售的记录
    const { data: fl261247AsSales } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('wechat_name', 'fl261247');
    
    if (fl261247AsSales && fl261247AsSales.length > 0) {
      console.log('✅ fl261247作为销售的记录:');
      fl261247AsSales.forEach(sale => {
        console.log(`  - ID: ${sale.id}`);
        console.log(`  - 销售代码: ${sale.sales_code}`);
        console.log(`  - 微信号: ${sale.wechat_name}`);
        console.log(`  - 上级销售ID: ${sale.primary_sales_id}`);
        console.log(`  - 佣金率: ${sale.commission_rate}`);
      });
    } else {
      console.log('❌ fl261247在secondary_sales表中无记录');
    }
    
    // 2. 查找fl261247作为客户的订单
    console.log('\n2️⃣ 查找fl261247作为客户的订单...\n');
    
    const { data: fl261247AsCustomer } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_wechat', 'fl261247');
    
    if (fl261247AsCustomer && fl261247AsCustomer.length > 0) {
      console.log(`✅ fl261247作为客户有 ${fl261247AsCustomer.length} 个订单:`);
      fl261247AsCustomer.forEach((order, index) => {
        console.log(`\n  订单${index + 1}:`);
        console.log(`    - 订单ID: ${order.id}`);
        console.log(`    - 客户微信: ${order.customer_wechat}`);
        console.log(`    - sales_code: ${order.sales_code}`);
        console.log(`    - primary_sales_id: ${order.primary_sales_id}`);
        console.log(`    - secondary_sales_id: ${order.secondary_sales_id}`);
        console.log(`    - TradingView: ${order.tradingview_username}`);
        console.log(`    - 金额: ${order.amount}`);
        console.log(`    - 状态: ${order.status}`);
      });
      
      // 分析sales_code对应的销售
      console.log('\n3️⃣ 分析订单中的sales_code对应的销售...\n');
      
      const salesCodes = [...new Set(fl261247AsCustomer.map(o => o.sales_code).filter(Boolean))];
      
      for (const code of salesCodes) {
        console.log(`\n  查找sales_code: ${code}`);
        
        // 在primary_sales表查找
        const { data: primarySale } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('sales_code', code)
          .single();
        
        if (primarySale) {
          console.log(`    ✅ 在primary_sales表找到:`);
          console.log(`       - 微信号: ${primarySale.wechat_name}`);
          console.log(`       - 类型: 一级销售`);
        }
        
        // 在secondary_sales表查找
        const { data: secondarySale } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('sales_code', code)
          .single();
        
        if (secondarySale) {
          console.log(`    ✅ 在secondary_sales表找到:`);
          console.log(`       - 微信号: ${secondarySale.wechat_name}`);
          console.log(`       - 类型: ${secondarySale.primary_sales_id ? '二级销售' : '独立销售'}`);
          
          if (secondarySale.primary_sales_id) {
            // 查找上级销售
            const { data: parentSale } = await supabase
              .from('primary_sales')
              .select('wechat_name')
              .eq('id', secondarySale.primary_sales_id)
              .single();
            
            if (parentSale) {
              console.log(`       - 上级销售: ${parentSale.wechat_name}`);
            }
          }
        }
        
        if (!primarySale && !secondarySale) {
          console.log(`    ❌ sales_code ${code} 在销售表中找不到！`);
        }
      }
    } else {
      console.log('❌ fl261247作为客户无订单记录');
    }
    
    // 4. 查找WML792355703的信息
    console.log('\n4️⃣ 查找WML792355703的信息...\n');
    
    const { data: wmlSales } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
    
    if (wmlSales) {
      console.log('✅ WML792355703信息:');
      console.log(`  - ID: ${wmlSales.id}`);
      console.log(`  - 销售代码: ${wmlSales.sales_code}`);
      console.log(`  - 微信号: ${wmlSales.wechat_name}`);
      console.log(`  - 类型: 一级销售`);
      
      // 查找WML792355703管理的二级销售
      const { data: managedSales } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', wmlSales.id);
      
      if (managedSales && managedSales.length > 0) {
        console.log(`\n  管理的二级销售 (${managedSales.length}个):`);
        managedSales.forEach(s => {
          console.log(`    - ${s.wechat_name} (${s.sales_code})`);
        });
      }
    }
    
    // 5. 分析问题
    console.log('\n' + '='.repeat(50));
    console.log('📋 问题分析:\n');
    
    console.log('可能的原因:');
    console.log('1. fl261247既是客户又是二级销售');
    console.log('2. fl261247作为客户下单时，订单记录的sales_code可能是:');
    console.log('   - WML792355703的sales_code（一级销售直接的链接）');
    console.log('   - 或fl261247自己的sales_code（自己购买）');
    console.log('3. 两个页面的逻辑差异:');
    console.log('   - 客户管理：基于订单的sales_code查找销售，可能查到fl261247自己');
    console.log('   - 订单管理：可能显示实际的sales_code对应的销售（WML792355703）');
    
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

// 立即执行
diagnoseSalesRelationship().then(() => {
  console.log('\n✅ 诊断完成！');
});
