// 🔍 检查所有非25%佣金率的二级销售和独立销售
// 在 https://zhixing-seven.vercel.app/admin/sales 控制台运行

console.log('🔍 检查非25%佣金率的存量销售...\n');
console.log('='.repeat(50));

async function checkNon25PercentSales() {
  try {
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    // 1. 查询所有二级销售（包括独立销售）
    const { data: secondarySales, error } = await supabase
      .from('secondary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    console.log(`📊 二级销售表总记录数: ${secondarySales.length}`);
    
    // 2. 分析数据
    const analysis = {
      total: secondarySales.length,
      withPrimary: [],    // 有上级的二级销售
      independent: [],     // 独立销售（无上级）
      non25Percent: [],    // 非25%佣金率的记录
      rate25: [],          // 25%佣金率
      rate0: [],           // 0%佣金率
      rateOther: []        // 其他佣金率
    };
    
    secondarySales.forEach(sale => {
      // 分类：有上级 vs 独立
      if (sale.primary_sales_id) {
        analysis.withPrimary.push(sale);
      } else {
        analysis.independent.push(sale);
      }
      
      // 分析佣金率
      const rate = sale.commission_rate;
      const ratePercent = rate > 1 ? rate : (rate * 100);
      
      // 判断是否为25%
      const is25 = (rate === 0.25 || rate === 25);
      const is0 = (rate === 0 || rate === null || rate === undefined);
      
      if (is25) {
        analysis.rate25.push(sale);
      } else if (is0) {
        analysis.rate0.push(sale);
      } else {
        analysis.rateOther.push(sale);
        analysis.non25Percent.push({
          ...sale,
          rate_percent: ratePercent,
          type: sale.primary_sales_id ? '二级销售' : '独立销售'
        });
      }
    });
    
    // 3. 显示统计结果
    console.log('\n📈 销售分类统计:');
    console.log(`  有上级的二级销售: ${analysis.withPrimary.length}人`);
    console.log(`  独立销售（无上级）: ${analysis.independent.length}人`);
    
    console.log('\n💰 佣金率分布:');
    console.log(`  25%佣金率: ${analysis.rate25.length}人`);
    console.log(`  0%或未设置: ${analysis.rate0.length}人`);
    console.log(`  其他佣金率: ${analysis.rateOther.length}人`);
    
    // 4. 详细显示非25%的销售
    if (analysis.non25Percent.length > 0) {
      console.log('\n⚠️ 非25%佣金率的销售明细:');
      console.log('（这些销售需要保留其自定义佣金率）\n');
      
      // 按佣金率分组
      const groupedByRate = {};
      analysis.non25Percent.forEach(sale => {
        const key = `${sale.rate_percent}%`;
        if (!groupedByRate[key]) {
          groupedByRate[key] = [];
        }
        groupedByRate[key].push(sale);
      });
      
      Object.entries(groupedByRate).forEach(([rate, sales]) => {
        console.log(`  📍 ${rate} (${sales.length}人):`);
        sales.forEach(sale => {
          console.log(`     - ${sale.wechat_name || '未设置微信'} (${sale.type})`);
          console.log(`       销售代码: ${sale.sales_code}`);
          console.log(`       存储值: ${sale.commission_rate}`);
          if (sale.primary_sales_id) {
            console.log(`       上级ID: ${sale.primary_sales_id}`);
          }
        });
      });
    } else {
      console.log('\n✅ 所有二级销售和独立销售都是25%佣金率！');
    }
    
    // 5. 显示0%或未设置的销售
    if (analysis.rate0.length > 0) {
      console.log('\n⚠️ 0%或未设置佣金率的销售:');
      analysis.rate0.forEach(sale => {
        const type = sale.primary_sales_id ? '二级销售' : '独立销售';
        console.log(`  - ${sale.wechat_name || '未设置微信'} (${type})`);
        console.log(`    销售代码: ${sale.sales_code}`);
        console.log(`    佣金率值: ${sale.commission_rate}`);
      });
      console.log('\n💡 这些销售将使用默认的25%佣金率');
    }
    
    // 6. 生成修复建议
    console.log('\n' + '='.repeat(50));
    console.log('📋 总结:');
    console.log(`  - 总计 ${analysis.total} 个二级/独立销售`);
    console.log(`  - ${analysis.rate25.length} 个已经是25%`);
    console.log(`  - ${analysis.non25Percent.length} 个使用自定义佣金率（需保留）`);
    console.log(`  - ${analysis.rate0.length} 个未设置（将默认25%）`);
    
    if (analysis.non25Percent.length > 0) {
      console.log('\n💡 建议:');
      console.log('1. 非25%的销售是一级销售自定义设置的，应该保留');
      console.log('2. 未设置的销售会自动使用25%默认值');
      console.log('3. 一级销售可以在对账页面随时调整二级的佣金率');
    }
    
    // 返回结果供后续使用
    return analysis;
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 立即执行
checkNon25PercentSales().then(result => {
  if (result) {
    window.salesCommissionAnalysis = result;
    console.log('\n💾 分析结果已保存到 window.salesCommissionAnalysis');
    
    // 如果需要更新0%的销售为25%，可以运行：
    if (result.rate0.length > 0) {
      console.log('\n如需将未设置的销售更新为25%，运行: updateZeroRateTo25()');
      
      window.updateZeroRateTo25 = async function() {
        console.log('🔧 开始更新0%佣金率为25%...');
        
        const supabase = window.SupabaseService?.supabase || window.supabaseClient;
        let updateCount = 0;
        
        for (const sale of result.rate0) {
          try {
            const { error } = await supabase
              .from('secondary_sales')
              .update({ commission_rate: 0.25 })
              .eq('id', sale.id);
            
            if (!error) {
              updateCount++;
              console.log(`  ✅ 更新 ${sale.wechat_name || sale.sales_code} 成功`);
            } else {
              console.error(`  ❌ 更新 ${sale.wechat_name || sale.sales_code} 失败:`, error);
            }
          } catch (err) {
            console.error(`  ❌ 更新失败:`, err);
          }
        }
        
        console.log(`\n✅ 完成！更新了 ${updateCount}/${result.rate0.length} 条记录`);
        console.log('请刷新页面查看更新结果');
      };
    }
  }
});
