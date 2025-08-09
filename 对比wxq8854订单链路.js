// 🔍 对比wxq8854在不同页面的显示
// 在管理员后台控制台运行

console.log('🔍 开始对比wxq8854的订单链路...\n');
console.log('='.repeat(50));

async function compareWxq8854() {
  try {
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    // 1. 查找wxq8854的订单
    console.log('\n1️⃣ 查找wxq8854的订单...\n');
    
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_wechat', 'wxq8854');
    
    if (orders && orders.length > 0) {
      console.log(`✅ 找到 ${orders.length} 个订单:`);
      orders.forEach((order, index) => {
        console.log(`\n订单${index + 1}:`);
        console.log(`  - 订单ID: ${order.id}`);
        console.log(`  - 客户: ${order.customer_wechat}`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - primary_sales_id: ${order.primary_sales_id}`);
        console.log(`  - secondary_sales_id: ${order.secondary_sales_id}`);
        console.log(`  - 金额: ${order.amount}`);
        console.log(`  - 状态: ${order.status}`);
      });
      
      // 2. 分析sales_code
      console.log('\n2️⃣ 分析sales_code对应的销售...\n');
      
      const salesCodes = [...new Set(orders.map(o => o.sales_code).filter(Boolean))];
      
      for (const code of salesCodes) {
        console.log(`\n查找 sales_code: ${code}`);
        
        // 在primary_sales表查找
        const { data: primarySale } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('sales_code', code)
          .single();
        
        if (primarySale) {
          console.log(`  ✅ 在primary_sales表找到:`);
          console.log(`     - 微信号: ${primarySale.wechat_name}`);
          console.log(`     - ID: ${primarySale.id}`);
          console.log(`     - 类型: 一级销售`);
        }
        
        // 在secondary_sales表查找
        const { data: secondarySale } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('sales_code', code)
          .single();
        
        if (secondarySale) {
          console.log(`  ✅ 在secondary_sales表找到:`);
          console.log(`     - 微信号: ${secondarySale.wechat_name}`);
          console.log(`     - ID: ${secondarySale.id}`);
          console.log(`     - primary_sales_id: ${secondarySale.primary_sales_id}`);
          
          // 如果是Liangjunhao889，查找他的上级
          if (secondarySale.wechat_name === 'Liangjunhao889' && secondarySale.primary_sales_id) {
            const { data: parentSale } = await supabase
              .from('primary_sales')
              .select('*')
              .eq('id', secondarySale.primary_sales_id)
              .single();
            
            if (parentSale) {
              console.log(`     - 上级销售: ${parentSale.wechat_name}`);
              console.log(`     - 上级ID: ${parentSale.id}`);
            }
          }
        }
      }
      
      // 3. 查找Liangjunhao889的信息
      console.log('\n3️⃣ 查找Liangjunhao889的信息...\n');
      
      const { data: liangjunhao } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('wechat_name', 'Liangjunhao889')
        .single();
      
      if (liangjunhao) {
        console.log('✅ Liangjunhao889信息:');
        console.log(`  - ID: ${liangjunhao.id}`);
        console.log(`  - 销售代码: ${liangjunhao.sales_code}`);
        console.log(`  - 佣金率: ${liangjunhao.commission_rate}`);
        console.log(`  - primary_sales_id: ${liangjunhao.primary_sales_id}`);
        
        if (liangjunhao.primary_sales_id) {
          const { data: zhang } = await supabase
            .from('primary_sales')
            .select('*')
            .eq('id', liangjunhao.primary_sales_id)
            .single();
          
          if (zhang) {
            console.log(`  - 上级销售: ${zhang.wechat_name}`);
          }
        }
      }
      
      // 4. 对比页面显示逻辑
      console.log('\n4️⃣ 页面显示逻辑对比...\n');
      
      console.log('客户管理页面逻辑:');
      console.log('  1. 通过订单的sales_code查找销售');
      console.log('  2. 如果sales_code = Liangjunhao889的code');
      console.log('  3. 显示: Liangjunhao889（二级）(张子俊) ✅');
      
      console.log('\n订单管理页面逻辑:');
      console.log('  1. 优先使用primary_sales_id');
      console.log('  2. 其次使用secondary_sales_id');
      console.log('  3. 最后使用sales_code');
      console.log('  4. 应该显示什么？需要看订单的实际字段值');
      
      // 5. 判断哪个正确
      console.log('\n5️⃣ 结论...\n');
      
      if (orders[0]) {
        const order = orders[0];
        console.log('订单字段值:');
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - primary_sales_id: ${order.primary_sales_id}`);
        console.log(`  - secondary_sales_id: ${order.secondary_sales_id}`);
        
        console.log('\n正确的链路应该是:');
        console.log('  客户 wxq8854 → 二级销售 Liangjunhao889 → 一级销售 张子俊');
        
        if (order.sales_code === liangjunhao?.sales_code) {
          console.log('\n✅ sales_code正确指向Liangjunhao889');
        }
        
        if (order.secondary_sales_id === liangjunhao?.id) {
          console.log('✅ secondary_sales_id正确指向Liangjunhao889');
        }
      }
    }
    
  } catch (error) {
    console.error('对比过程出错:', error);
  }
}

// 立即执行
compareWxq8854().then(() => {
  console.log('\n✅ 对比完成！');
});
