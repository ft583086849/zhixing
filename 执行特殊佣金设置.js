// 🔧 执行特殊佣金设置
// 在管理员后台控制台运行

console.log('🔧 开始设置特殊佣金率...\n');
console.log('='.repeat(50));

async function setSpecialCommissionRates() {
  try {
    const supabase = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (!supabase) {
      console.error('❌ 无法访问Supabase客户端');
      return;
    }
    
    let updateCount = 0;
    
    // 1. 更新张子俊的佣金率为0%
    console.log('\n1️⃣ 查找并更新张子俊...');
    
    // 先查找张子俊在哪个表
    const { data: primaryZhang } = await supabase
      .from('primary_sales')
      .select('*')
      .or('wechat_name.eq.张子俊,wechat_name.ilike.%张子俊%');
    
    const { data: secondaryZhang } = await supabase
      .from('secondary_sales')
      .select('*')
      .or('wechat_name.eq.张子俊,wechat_name.ilike.%张子俊%');
    
    if (primaryZhang && primaryZhang.length > 0) {
      console.log('  找到一级销售张子俊:', primaryZhang);
      for (const zhang of primaryZhang) {
        const { error } = await supabase
          .from('primary_sales')
          .update({ commission_rate: 0 })
          .eq('id', zhang.id);
        
        if (!error) {
          console.log(`  ✅ 更新一级销售 ${zhang.wechat_name} (ID: ${zhang.id}) 佣金率为0%`);
          updateCount++;
        } else {
          console.error(`  ❌ 更新失败:`, error);
        }
      }
    }
    
    if (secondaryZhang && secondaryZhang.length > 0) {
      console.log('  找到二级/独立销售张子俊:', secondaryZhang);
      for (const zhang of secondaryZhang) {
        const { error } = await supabase
          .from('secondary_sales')
          .update({ commission_rate: 0 })
          .eq('id', zhang.id);
        
        if (!error) {
          console.log(`  ✅ 更新二级销售 ${zhang.wechat_name} (ID: ${zhang.id}) 佣金率为0%`);
          updateCount++;
        } else {
          console.error(`  ❌ 更新失败:`, error);
        }
      }
    }
    
    if (!primaryZhang?.length && !secondaryZhang?.length) {
      console.log('  ⚠️ 未找到张子俊的记录');
    }
    
    // 2. 更新Liangjunhao889的佣金率为0%
    console.log('\n2️⃣ 查找并更新Liangjunhao889...');
    
    const { data: liangjunhao } = await supabase
      .from('secondary_sales')
      .select('*')
      .or('wechat_name.eq.Liangjunhao889,wechat_name.ilike.%Liangjunhao%');
    
    if (liangjunhao && liangjunhao.length > 0) {
      console.log('  找到二级销售Liangjunhao889:', liangjunhao);
      for (const liang of liangjunhao) {
        const { error } = await supabase
          .from('secondary_sales')
          .update({ commission_rate: 0 })
          .eq('id', liang.id);
        
        if (!error) {
          console.log(`  ✅ 更新二级销售 ${liang.wechat_name} (ID: ${liang.id}) 佣金率为0%`);
          updateCount++;
          
          // 检查是否属于张子俊
          if (liang.primary_sales_id) {
            const { data: primary } = await supabase
              .from('primary_sales')
              .select('wechat_name')
              .eq('id', liang.primary_sales_id)
              .single();
            
            if (primary) {
              console.log(`     所属一级销售: ${primary.wechat_name}`);
            }
          }
        } else {
          console.error(`  ❌ 更新失败:`, error);
        }
      }
    } else {
      console.log('  ⚠️ 未找到Liangjunhao889的记录');
    }
    
    // 3. 验证更新结果
    console.log('\n3️⃣ 验证更新结果...');
    
    // 再次查询验证
    const { data: verifyPrimary } = await supabase
      .from('primary_sales')
      .select('id, wechat_name, commission_rate')
      .or('wechat_name.eq.张子俊,wechat_name.ilike.%张子俊%');
    
    const { data: verifySecondary } = await supabase
      .from('secondary_sales')
      .select('id, wechat_name, commission_rate, primary_sales_id')
      .or('wechat_name.eq.张子俊,wechat_name.eq.Liangjunhao889,wechat_name.ilike.%张子俊%,wechat_name.ilike.%Liangjunhao%');
    
    console.log('\n📋 最终结果:');
    
    if (verifyPrimary && verifyPrimary.length > 0) {
      console.log('  一级销售:');
      verifyPrimary.forEach(s => {
        console.log(`    - ${s.wechat_name}: ${s.commission_rate === 0 ? '✅ 0%' : '❌ ' + (s.commission_rate * 100) + '%'}`);
      });
    }
    
    if (verifySecondary && verifySecondary.length > 0) {
      console.log('  二级/独立销售:');
      verifySecondary.forEach(s => {
        const type = s.primary_sales_id ? '二级' : '独立';
        console.log(`    - ${s.wechat_name} (${type}): ${s.commission_rate === 0 ? '✅ 0%' : '❌ ' + (s.commission_rate * 100) + '%'}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ 完成！共更新 ${updateCount} 条记录`);
    console.log('💡 请刷新页面查看更新效果');
    
    return {
      updateCount,
      primaryUpdated: verifyPrimary,
      secondaryUpdated: verifySecondary
    };
    
  } catch (error) {
    console.error('执行过程出错:', error);
  }
}

// 立即执行
setSpecialCommissionRates().then(result => {
  if (result) {
    window.specialCommissionResult = result;
    console.log('\n💾 结果已保存到 window.specialCommissionResult');
  }
});
