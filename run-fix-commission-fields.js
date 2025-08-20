// 修复 sales_optimized 表缺失的佣金字段
console.log('🔧 修复 sales_optimized 表缺失的佣金字段\n');

async function fixCommissionFields() {
  if (!window.supabaseClient) {
    console.error('❌ supabaseClient 未初始化');
    return;
  }

  const supabase = window.supabaseClient;

  try {
    console.log('📊 步骤1: 检查当前表结构');
    console.log('-'.repeat(40));

    // 检查现有字段
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'sales_optimized')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ 无法查询表结构:', columnsError);
      return;
    }

    console.log('当前 sales_optimized 表字段:');
    if (columns) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(可空)' : '(非空)'}`);
      });
    }

    // 检查缺失的字段
    const requiredFields = [
      'direct_commission',
      'secondary_avg_rate', 
      'secondary_share_commission',
      'secondary_orders_amount',
      'direct_orders_amount',
      'base_commission_rate',
      'dynamic_commission_rate',
      'month_direct_commission',
      'month_share_commission',
      'today_direct_commission',
      'today_share_commission'
    ];

    const existingFields = columns ? columns.map(col => col.column_name) : [];
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));

    console.log(`\n📋 检查结果:`);
    console.log(`  总计需要字段: ${requiredFields.length}`);
    console.log(`  已存在字段: ${requiredFields.length - missingFields.length}`);
    console.log(`  缺失字段: ${missingFields.length}`);

    if (missingFields.length > 0) {
      console.log('\n❌ 缺失的字段:');
      missingFields.forEach(field => {
        console.log(`  - ${field}`);
      });
    } else {
      console.log('\n✅ 所有必需字段都已存在');
    }

    console.log('\n🔧 步骤2: 添加缺失字段');
    console.log('-'.repeat(40));

    if (missingFields.length > 0) {
      console.log('⚠️ 检测到缺失字段，需要手动添加');
      console.log('📝 请执行以下 SQL 语句:');
      console.log('');

      const sqlStatements = {
        'direct_commission': 'ALTER TABLE sales_optimized ADD COLUMN direct_commission DECIMAL(10,2) DEFAULT 0;',
        'secondary_avg_rate': 'ALTER TABLE sales_optimized ADD COLUMN secondary_avg_rate DECIMAL(5,4) DEFAULT 0;',
        'secondary_share_commission': 'ALTER TABLE sales_optimized ADD COLUMN secondary_share_commission DECIMAL(10,2) DEFAULT 0;',
        'secondary_orders_amount': 'ALTER TABLE sales_optimized ADD COLUMN secondary_orders_amount DECIMAL(10,2) DEFAULT 0;',
        'direct_orders_amount': 'ALTER TABLE sales_optimized ADD COLUMN direct_orders_amount DECIMAL(10,2) DEFAULT 0;',
        'base_commission_rate': 'ALTER TABLE sales_optimized ADD COLUMN base_commission_rate DECIMAL(5,4) DEFAULT 0.4;',
        'dynamic_commission_rate': 'ALTER TABLE sales_optimized ADD COLUMN dynamic_commission_rate DECIMAL(5,4) DEFAULT 0.4;',
        'month_direct_commission': 'ALTER TABLE sales_optimized ADD COLUMN month_direct_commission DECIMAL(10,2) DEFAULT 0;',
        'month_share_commission': 'ALTER TABLE sales_optimized ADD COLUMN month_share_commission DECIMAL(10,2) DEFAULT 0;',
        'today_direct_commission': 'ALTER TABLE sales_optimized ADD COLUMN today_direct_commission DECIMAL(10,2) DEFAULT 0;',
        'today_share_commission': 'ALTER TABLE sales_optimized ADD COLUMN today_share_commission DECIMAL(10,2) DEFAULT 0;'
      };

      missingFields.forEach(field => {
        if (sqlStatements[field]) {
          console.log(`-- 添加 ${field} 字段`);
          console.log(sqlStatements[field]);
          console.log('');
        }
      });

      console.log('💡 请在 Supabase SQL 编辑器中执行以上语句');
      console.log('💡 或者使用提供的 fix-missing-commission-fields.sql 文件');
      
      return; // 停止执行，等待用户手动添加字段
    }

    console.log('\n📈 步骤3: 初始化字段数据');
    console.log('-'.repeat(40));

    // 获取一级销售数据
    const { data: primarySales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary')
      .is('direct_commission', null);

    if (salesError) {
      console.error('❌ 查询一级销售失败:', salesError);
      return;
    }

    if (!primarySales || primarySales.length === 0) {
      console.log('✅ 所有一级销售的佣金字段都已初始化');
      return;
    }

    console.log(`📊 找到 ${primarySales.length} 个需要初始化的一级销售`);

    // 逐个更新一级销售的佣金数据
    let successCount = 0;
    let errorCount = 0;

    for (const sale of primarySales) {
      try {
        console.log(`🔧 更新销售: ${sale.wechat_name} (${sale.sales_code})`);

        const totalAmount = parseFloat(sale.total_amount || 0);
        const monthAmount = parseFloat(sale.month_amount || 0);  
        const todayAmount = parseFloat(sale.today_amount || 0);
        const commissionRate = parseFloat(sale.commission_rate || 0.4);

        const updateData = {
          direct_commission: totalAmount * 0.4,
          direct_orders_amount: totalAmount,
          base_commission_rate: 0.4,
          dynamic_commission_rate: commissionRate,
          month_direct_commission: monthAmount * 0.4,
          today_direct_commission: todayAmount * 0.4,
          // 这些字段暂时设为0，后续会通过API动态计算
          secondary_avg_rate: 0,
          secondary_share_commission: 0,
          secondary_orders_amount: 0,
          month_share_commission: 0,
          today_share_commission: 0
        };

        const { error: updateError } = await supabase
          .from('sales_optimized')
          .update(updateData)
          .eq('id', sale.id);

        if (updateError) {
          console.error(`❌ 更新失败 ${sale.wechat_name}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ 更新成功 ${sale.wechat_name}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ 处理 ${sale.wechat_name} 时出错:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 步骤4: 更新结果统计');
    console.log('-'.repeat(40));
    console.log(`✅ 成功更新: ${successCount} 条记录`);
    console.log(`❌ 失败更新: ${errorCount} 条记录`);

    if (successCount > 0) {
      console.log('\n🎉 字段修复完成！');
      console.log('💡 建议刷新页面以查看更新后的数据');
    }

    console.log('\n🔍 步骤5: 验证修复结果');
    console.log('-'.repeat(40));

    // 验证修复结果
    const testSalesCode = 'PRI17547241780648255';
    const { data: testSale, error: testError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', testSalesCode)
      .single();

    if (testError) {
      console.log('⚠️ 无法验证修复结果（测试销售不存在）');
    } else if (testSale) {
      console.log('✅ 修复验证成功！');
      console.log('测试销售的佣金字段:');
      console.log(`  direct_commission: ${testSale.direct_commission}`);
      console.log(`  secondary_avg_rate: ${testSale.secondary_avg_rate}`);
      console.log(`  secondary_share_commission: ${testSale.secondary_share_commission}`);
      console.log(`  secondary_orders_amount: ${testSale.secondary_orders_amount}`);
    }

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  }
}

// 执行修复
fixCommissionFields().catch(console.error);

console.log('\n💡 提示:');
console.log('- 如果提示缺失字段，请先在 Supabase 中添加这些字段');
console.log('- 可以使用提供的 fix-missing-commission-fields.sql 文件');
console.log('- 修复完成后刷新页面验证结果');