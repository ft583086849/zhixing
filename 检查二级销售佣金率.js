// 🔍 检查所有二级销售的佣金率分布
// 在 https://zhixing-seven.vercel.app/admin/sales 控制台运行

console.log('🔍 开始检查二级销售佣金率分布...\n');
console.log('='.repeat(50));

async function checkSecondaryCommissionRates() {
  try {
    // 1. 获取所有二级销售数据
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    // 查询secondary_sales表
    const { data: secondarySales, error } = await supabase
      .from('secondary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    console.log(`\n📊 二级销售总数: ${secondarySales.length}`);
    
    // 2. 分析佣金率分布
    const rateDistribution = {};
    const nonStandardRates = [];
    
    secondarySales.forEach(sale => {
      const rate = sale.commission_rate;
      const ratePercent = rate > 1 ? rate : (rate * 100);
      
      // 统计分布
      if (!rateDistribution[ratePercent]) {
        rateDistribution[ratePercent] = [];
      }
      rateDistribution[ratePercent].push(sale);
      
      // 记录非25%的销售
      if (ratePercent !== 25 && ratePercent !== 0.25) {
        nonStandardRates.push({
          id: sale.id,
          wechat_name: sale.wechat_name,
          sales_code: sale.sales_code,
          commission_rate: sale.commission_rate,
          rate_percent: ratePercent,
          primary_sales_id: sale.primary_sales_id,
          is_independent: !sale.primary_sales_id
        });
      }
    });
    
    // 3. 显示分布情况
    console.log('\n💰 佣金率分布:');
    Object.entries(rateDistribution).forEach(([rate, sales]) => {
      console.log(`  ${rate}%: ${sales.length}人`);
      if (sales.length <= 3) {
        // 显示具体是谁
        sales.forEach(s => {
          console.log(`    - ${s.wechat_name} (${s.sales_code})`);
        });
      }
    });
    
    // 4. 显示非标准佣金率的二级销售
    if (nonStandardRates.length > 0) {
      console.log('\n⚠️ 非25%佣金率的二级销售:');
      nonStandardRates.forEach(sale => {
        const type = sale.is_independent ? '独立销售' : '二级销售';
        console.log(`\n  ${sale.wechat_name} (${type})`);
        console.log(`    - ID: ${sale.id}`);
        console.log(`    - 销售代码: ${sale.sales_code}`);
        console.log(`    - 当前佣金率: ${sale.rate_percent}%`);
        console.log(`    - 存储值: ${sale.commission_rate}`);
        if (!sale.is_independent && sale.primary_sales_id) {
          console.log(`    - 所属一级销售ID: ${sale.primary_sales_id}`);
        }
      });
      
      console.log(`\n📈 统计:`);
      console.log(`  - 非25%佣金率的二级销售: ${nonStandardRates.length}人`);
      console.log(`  - 占比: ${(nonStandardRates.length / secondarySales.length * 100).toFixed(1)}%`);
    } else {
      console.log('\n✅ 所有二级销售都是25%佣金率');
    }
    
    // 5. 检查独立销售
    const independentSales = secondarySales.filter(s => !s.primary_sales_id);
    console.log(`\n🔍 独立销售分析:`);
    console.log(`  - 独立销售数量: ${independentSales.length}`);
    if (independentSales.length > 0) {
      console.log(`  - 独立销售列表:`);
      independentSales.forEach(sale => {
        const rate = sale.commission_rate > 1 ? sale.commission_rate : (sale.commission_rate * 100);
        console.log(`    - ${sale.wechat_name}: ${rate}% (应该是30%)`);
      });
    }
    
    // 6. 建议
    console.log('\n💡 建议:');
    if (nonStandardRates.length > 0) {
      console.log('1. 存在非25%佣金率的二级销售，需要保留他们的自定义佣金率');
      console.log('2. 新注册的二级销售默认设为25%');
      console.log('3. 独立销售应该统一设为30%');
    } else {
      console.log('1. 所有二级销售都是标准的25%，可以安全设置默认值');
      console.log('2. 独立销售需要调整为30%');
    }
    
    // 7. 返回汇总数据
    return {
      total: secondarySales.length,
      distribution: rateDistribution,
      nonStandardRates: nonStandardRates,
      independentSales: independentSales
    };
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 立即执行
checkSecondaryCommissionRates().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('✅ 检查完成！');
  
  // 保存结果到window对象供后续使用
  if (result) {
    window.secondaryCommissionAnalysis = result;
    console.log('💾 结果已保存到 window.secondaryCommissionAnalysis');
  }
});
