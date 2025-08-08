// 检查销售数据完整性的调试脚本
// 在浏览器控制台运行此脚本

async function 检查销售数据() {
  console.log('🔍 开始检查销售数据...\n');
  
  try {
    // 获取所有一级销售
    const { data: primarySales } = await window.supabaseClient
      .from('primary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`📊 一级销售总数: ${primarySales?.length || 0}`);
    
    // 获取所有二级销售
    const { data: secondarySales } = await window.supabaseClient
      .from('secondary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`📊 二级销售总数: ${secondarySales?.length || 0}`);
    
    // 检查88测试下午
    const 测试下午 = primarySales?.find(s => 
      s.wechat_name?.includes('88测试下午') || 
      s.name?.includes('88测试下午')
    );
    
    if (测试下午) {
      console.log('\n✅ 找到一级销售"88测试下午":');
      console.log(`   - ID: ${测试下午.id}`);
      console.log(`   - 销售代码: ${测试下午.sales_code}`);
      console.log(`   - 微信号: ${测试下午.wechat_name}`);
      console.log(`   - 佣金率: ${测试下午.commission_rate}`);
      
      // 查找其下的二级销售
      const 关联二级 = secondarySales?.filter(s => s.primary_sales_id === 测试下午.id);
      console.log(`\n   📋 直接关联的二级销售: ${关联二级?.length || 0} 个`);
      
      if (关联二级?.length > 0) {
        关联二级.forEach(s => {
          console.log(`     - ${s.wechat_name} (ID: ${s.id}, primary_sales_id: ${s.primary_sales_id})`);
        });
      }
      
      // 查找可能通过名称关联的二级
      const 可能关联 = secondarySales?.filter(s => 
        s.wechat_name?.includes('88测试下午') || 
        s.name?.includes('88测试下午')
      );
      console.log(`\n   🔍 名称包含"88测试下午"的二级: ${可能关联?.length || 0} 个`);
      
      if (可能关联?.length > 0) {
        可能关联.forEach(s => {
          console.log(`     - ${s.wechat_name}`);
          console.log(`       • ID: ${s.id}`);
          console.log(`       • primary_sales_id: ${s.primary_sales_id || '未设置'}`);
          console.log(`       • 销售代码: ${s.sales_code}`);
        });
      }
    } else {
      console.log('\n❌ 未找到"88测试下午"');
    }
    
    // 查找89上线
    const 上线 = primarySales?.find(s => 
      s.wechat_name === '89上线' || 
      s.name === '89上线'
    );
    
    if (上线) {
      console.log('\n✅ 找到一级销售"89上线":');
      console.log(`   - ID: ${上线.id}`);
      console.log(`   - 销售代码: ${上线.sales_code}`);
      console.log(`   - 微信号: ${上线.wechat_name}`);
      
      // 查找其下的二级销售
      const 关联二级 = secondarySales?.filter(s => s.primary_sales_id === 上线.id);
      console.log(`\n   📋 直接关联的二级销售: ${关联二级?.length || 0} 个`);
      
      if (关联二级?.length > 0) {
        关联二级.forEach(s => {
          console.log(`     - ${s.wechat_name} (primary_sales_id: ${s.primary_sales_id})`);
        });
      }
    }
    
    // 统计所有二级销售的关联情况
    console.log('\n📊 二级销售关联统计:');
    const 有关联 = secondarySales?.filter(s => s.primary_sales_id)?.length || 0;
    const 无关联 = secondarySales?.filter(s => !s.primary_sales_id)?.length || 0;
    console.log(`   - 有primary_sales_id的: ${有关联} 个`);
    console.log(`   - 无primary_sales_id的: ${无关联} 个`);
    
    // 列出所有无关联的二级销售
    if (无关联 > 0) {
      console.log('\n⚠️ 无关联的二级销售:');
      secondarySales?.filter(s => !s.primary_sales_id).forEach(s => {
        console.log(`   - ${s.wechat_name || s.name} (ID: ${s.id}, 销售代码: ${s.sales_code})`);
      });
    }
    
    // 检查管理二级销售数量
    console.log('\n📊 一级销售管理统计:');
    primarySales?.forEach(p => {
      const count = secondarySales?.filter(s => s.primary_sales_id === p.id)?.length || 0;
      if (count > 0 || p.wechat_name?.includes('88') || p.wechat_name?.includes('89')) {
        console.log(`   - ${p.wechat_name}: 管理 ${count} 个二级销售`);
      }
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 执行检查
检查销售数据();
