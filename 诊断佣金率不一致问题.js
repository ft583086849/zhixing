// 🔍 诊断佣金率显示不一致问题
// 在管理员后台控制台运行

console.log('🔍 开始诊断佣金率不一致问题...\n');
console.log('='.repeat(50));

async function diagnoseCommissionRate() {
  try {
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    // 1. 查找WML792355703的原始数据
    console.log('\n1️⃣ 查找WML792355703的原始数据...\n');
    
    const { data: wmlData } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
    
    if (wmlData) {
      console.log('✅ primary_sales表中的数据:');
      console.log(`  - ID: ${wmlData.id}`);
      console.log(`  - 微信号: ${wmlData.wechat_name}`);
      console.log(`  - 销售代码: ${wmlData.sales_code}`);
      console.log(`  - 基础佣金率: ${wmlData.commission_rate}`);
      console.log(`  - 存储格式: ${wmlData.commission_rate > 1 ? '百分比' : '小数'}`);
      console.log(`  - 显示值: ${wmlData.commission_rate > 1 ? wmlData.commission_rate + '%' : (wmlData.commission_rate * 100) + '%'}`);
    }
    
    // 2. 获取管理的二级销售
    console.log('\n2️⃣ 查找管理的二级销售...\n');
    
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('primary_sales_id', wmlData.id);
    
    if (secondarySales && secondarySales.length > 0) {
      console.log(`✅ 管理 ${secondarySales.length} 个二级销售:`);
      secondarySales.forEach(s => {
        console.log(`  - ${s.wechat_name}: 佣金率 ${s.commission_rate}`);
      });
    } else {
      console.log('❌ 没有管理的二级销售');
    }
    
    // 3. 计算动态佣金率
    console.log('\n3️⃣ 动态佣金率计算...\n');
    
    // 获取所有订单
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'rejected');
    
    // 一级直接订单
    const primaryOrders = orders?.filter(o => o.sales_code === wmlData.sales_code) || [];
    const confirmedPrimaryOrders = primaryOrders.filter(o =>
      ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
    );
    
    const primaryAmount = confirmedPrimaryOrders.reduce((sum, o) => {
      const amount = o.actual_payment_amount || o.amount || 0;
      if (o.payment_method === 'alipay') {
        return sum + (amount / 7.15);
      }
      return sum + amount;
    }, 0);
    
    console.log(`一级直接订单金额: $${primaryAmount.toFixed(2)}`);
    
    // 二级销售订单
    let secondaryTotalAmount = 0;
    let secondaryTotalCommission = 0;
    
    if (secondarySales && secondarySales.length > 0) {
      for (const secondary of secondarySales) {
        const secondaryOrders = orders?.filter(o => 
          o.sales_code === secondary.sales_code &&
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
        ) || [];
        
        const amount = secondaryOrders.reduce((sum, o) => {
          const orderAmount = o.actual_payment_amount || o.amount || 0;
          if (o.payment_method === 'alipay') {
            return sum + (orderAmount / 7.15);
          }
          return sum + orderAmount;
        }, 0);
        
        let rate = secondary.commission_rate || 0.25;
        if (rate > 1) rate = rate / 100;
        
        secondaryTotalAmount += amount;
        secondaryTotalCommission += amount * rate;
        
        console.log(`  二级 ${secondary.wechat_name}: 订单金额 $${amount.toFixed(2)}, 佣金 $${(amount * rate).toFixed(2)}`);
      }
    }
    
    console.log(`二级销售总金额: $${secondaryTotalAmount.toFixed(2)}`);
    console.log(`二级销售总佣金: $${secondaryTotalCommission.toFixed(2)}`);
    
    // 计算动态佣金率
    const baseRate = wmlData.commission_rate > 1 ? wmlData.commission_rate / 100 : wmlData.commission_rate;
    const teamTotalAmount = primaryAmount + secondaryTotalAmount;
    
    if (teamTotalAmount > 0 && secondaryTotalAmount > 0) {
      const netCommission = (primaryAmount * baseRate) + 
                           (secondaryTotalAmount * baseRate - secondaryTotalCommission);
      const dynamicRate = netCommission / teamTotalAmount;
      
      console.log('\n📊 动态佣金率计算结果:');
      console.log(`  基础佣金率: ${(baseRate * 100).toFixed(2)}%`);
      console.log(`  团队总金额: $${teamTotalAmount.toFixed(2)}`);
      console.log(`  净佣金: $${netCommission.toFixed(2)}`);
      console.log(`  动态佣金率: ${(dynamicRate * 100).toFixed(2)}%`);
      
      if (Math.abs(dynamicRate * 100 - 2.5) < 0.1) {
        console.log('\n✅ 2.5%就是动态计算的结果！');
      }
    } else {
      console.log('\n动态佣金率: 使用基础佣金率 ' + (baseRate * 100).toFixed(2) + '%');
    }
    
    // 4. 检查Redux状态
    console.log('\n4️⃣ 检查当前页面状态...\n');
    
    if (window.store) {
      const state = window.store.getState();
      const adminSales = state.admin?.sales || [];
      const wmlInAdmin = adminSales.find(s => 
        s.sales?.wechat_name === 'WML792355703' || 
        s.sales?.sales_code === wmlData.sales_code
      );
      
      if (wmlInAdmin) {
        console.log('管理员页面显示:');
        console.log(`  - 佣金率: ${wmlInAdmin.commission_rate}%`);
        console.log(`  - 总订单: ${wmlInAdmin.total_orders}`);
        console.log(`  - 总金额: $${wmlInAdmin.total_amount}`);
        console.log(`  - 应返佣金: $${wmlInAdmin.commission_amount}`);
      }
    }
    
    // 5. 问题总结
    console.log('\n' + '='.repeat(50));
    console.log('📋 问题总结:\n');
    console.log('1. 数据库中存储的是基础佣金率（可能是0.15或15）');
    console.log('2. 销售管理页面显示的是动态计算的佣金率（2.5%）');
    console.log('3. 一级销售对账页面显示的可能是基础佣金率（15%）');
    console.log('4. 修改时应该修改基础佣金率，而不是动态佣金率');
    console.log('5. 输入框太小是UI问题，需要调整');
    
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

// 立即执行
diagnoseCommissionRate().then(() => {
  console.log('\n✅ 诊断完成！');
});
