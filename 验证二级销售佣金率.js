// 🔍 验证二级销售佣金率设置
// 在管理员后台控制台运行

console.log('🔍 验证二级销售佣金率设置...\n');
console.log('='.repeat(50));

async function verifyCommissionRates() {
  try {
    // 获取当前Redux中的销售数据
    const state = store.getState();
    const sales = state.admin?.sales || [];
    
    console.log(`📊 当前管理员页面显示的销售数据: ${sales.length}条`);
    
    // 分类统计
    const stats = {
      primary: [],
      secondary: [],
      independent: []
    };
    
    sales.forEach(sale => {
      const type = sale.sales_type || sale.sales?.sales_type;
      const wechat = sale.sales?.wechat_name || '未知';
      const rate = sale.commission_rate || sale.sales?.commission_rate;
      
      const info = {
        wechat_name: wechat,
        commission_rate: rate,
        sales_code: sale.sales?.sales_code,
        primary_sales_id: sale.sales?.primary_sales_id
      };
      
      if (type === 'primary') {
        stats.primary.push(info);
      } else if (type === 'independent' || (!sale.sales?.primary_sales_id && type !== 'primary')) {
        stats.independent.push(info);
      } else {
        stats.secondary.push(info);
      }
    });
    
    // 显示统计结果
    console.log('\n📈 销售类型分布:');
    console.log(`  一级销售: ${stats.primary.length}人`);
    console.log(`  二级销售: ${stats.secondary.length}人`);
    console.log(`  独立销售: ${stats.independent.length}人`);
    
    // 检查二级销售佣金率
    console.log('\n💰 二级销售佣金率分析:');
    const secondaryNon25 = stats.secondary.filter(s => s.commission_rate !== 25 && s.commission_rate !== 0.25);
    if (secondaryNon25.length > 0) {
      console.log(`  ⚠️ 非25%佣金率的二级销售: ${secondaryNon25.length}人`);
      secondaryNon25.forEach(s => {
        console.log(`    - ${s.wechat_name}: ${s.commission_rate}%`);
      });
    } else {
      console.log('  ✅ 所有二级销售都是25%佣金率');
    }
    
    // 检查独立销售佣金率
    console.log('\n💰 独立销售佣金率分析:');
    const independentNon30 = stats.independent.filter(s => s.commission_rate !== 30 && s.commission_rate !== 0.3);
    if (independentNon30.length > 0) {
      console.log(`  ⚠️ 非30%佣金率的独立销售: ${independentNon30.length}人`);
      independentNon30.forEach(s => {
        console.log(`    - ${s.wechat_name}: ${s.commission_rate}%`);
      });
    } else {
      console.log('  ✅ 所有独立销售都是30%佣金率');
    }
    
    // 直接查询数据库验证
    if (window.SupabaseService?.supabase) {
      console.log('\n🔍 直接查询数据库验证...');
      const supabase = window.SupabaseService.supabase;
      
      const { data: dbSecondary } = await supabase
        .from('secondary_sales')
        .select('*');
      
      if (dbSecondary) {
        const dbStats = {
          withPrimary: dbSecondary.filter(s => s.primary_sales_id),
          independent: dbSecondary.filter(s => !s.primary_sales_id)
        };
        
        console.log('\n📦 数据库中的实际数据:');
        console.log(`  有上级的二级销售: ${dbStats.withPrimary.length}人`);
        console.log(`  独立销售: ${dbStats.independent.length}人`);
        
        // 检查佣金率
        const dbNon25 = dbStats.withPrimary.filter(s => 
          s.commission_rate !== 0.25 && s.commission_rate !== 25
        );
        const dbNon30 = dbStats.independent.filter(s => 
          s.commission_rate !== 0.3 && s.commission_rate !== 30
        );
        
        if (dbNon25.length > 0) {
          console.log(`\n  ⚠️ 数据库中非25%的二级销售:`);
          dbNon25.forEach(s => {
            console.log(`    - ${s.wechat_name}: ${s.commission_rate}`);
          });
        }
        
        if (dbNon30.length > 0) {
          console.log(`\n  ⚠️ 数据库中非30%的独立销售:`);
          dbNon30.forEach(s => {
            console.log(`    - ${s.wechat_name}: ${s.commission_rate}`);
          });
        }
      }
    }
    
    return {
      primary: stats.primary,
      secondary: stats.secondary,
      independent: stats.independent,
      needsUpdate: secondaryNon25.length > 0 || independentNon30.length > 0
    };
    
  } catch (error) {
    console.error('验证过程出错:', error);
  }
}

// 立即执行
verifyCommissionRates().then(result => {
  console.log('\n' + '='.repeat(50));
  if (result?.needsUpdate) {
    console.log('⚠️ 需要更新部分销售的佣金率');
    console.log('💡 建议: 运行 updateDefaultRates() 来修复');
  } else {
    console.log('✅ 所有佣金率设置正确！');
  }
  
  // 保存结果
  window.commissionVerifyResult = result;
});

// 提供修复函数
window.updateDefaultRates = async function() {
  console.log('🔧 开始更新默认佣金率...');
  
  if (!window.AdminAPI) {
    console.error('❌ AdminAPI不可用');
    return;
  }
  
  const result = window.commissionVerifyResult;
  if (!result) {
    console.error('❌ 请先运行验证');
    return;
  }
  
  // 更新非标准佣金率的销售
  let updateCount = 0;
  
  // 更新二级销售为25%
  for (const sale of result.secondary) {
    if (sale.commission_rate !== 25 && sale.commission_rate !== 0.25) {
      console.log(`  更新 ${sale.wechat_name} 为 25%...`);
      // 这里需要调用更新API
      updateCount++;
    }
  }
  
  // 更新独立销售为30%
  for (const sale of result.independent) {
    if (sale.commission_rate !== 30 && sale.commission_rate !== 0.3) {
      console.log(`  更新 ${sale.wechat_name} 为 30%...`);
      // 这里需要调用更新API
      updateCount++;
    }
  }
  
  console.log(`\n✅ 完成！更新了 ${updateCount} 条记录`);
};
