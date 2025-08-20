// 测试佣金字段修复效果
console.log('🧪 测试佣金字段修复效果\n');

async function testCommissionFieldsFix() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };

  console.log('🔍 测试步骤:');
  console.log('1. 调用API获取数据');
  console.log('2. 检查关键佣金字段');
  console.log('3. 验证数据完整性');
  console.log('4. 检查兼容性处理');
  console.log('');

  try {
    console.log('📡 步骤1: 调用 getPrimarySalesSettlement API');
    console.log('-'.repeat(40));

    if (!window.SupabaseService) {
      console.error('❌ SupabaseService 未定义');
      return;
    }

    const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
    
    if (!response || !response.data) {
      console.error('❌ API返回数据为空');
      return;
    }

    console.log('✅ API调用成功');

    const { sales, stats } = response.data;

    console.log('\n📊 步骤2: 检查关键佣金字段');
    console.log('-'.repeat(40));

    // 检查关键字段
    const keyFields = [
      { name: 'total_commission', label: '总佣金', value: sales?.total_commission },
      { name: 'direct_commission', label: '一级销售佣金', value: sales?.direct_commission },
      { name: 'secondary_avg_rate', label: '平均二级佣金率', value: sales?.secondary_avg_rate },
      { name: 'secondary_share_commission', label: '二级佣金收益', value: sales?.secondary_share_commission },
      { name: 'secondary_orders_amount', label: '二级销售订单总额', value: sales?.secondary_orders_amount },
      { name: 'month_commission', label: '本月佣金', value: sales?.month_commission },
      { name: 'today_commission', label: '当日佣金', value: sales?.today_commission }
    ];

    let allFieldsPresent = true;
    let undefinedCount = 0;

    console.log('关键佣金字段检查:');
    keyFields.forEach(field => {
      const hasValue = field.value !== undefined && field.value !== null;
      const displayValue = hasValue ? field.value : '❌ undefined/null';
      
      console.log(`  ${field.label}: ${displayValue}`);
      
      if (!hasValue) {
        allFieldsPresent = false;
        undefinedCount++;
      }
    });

    console.log(`\n检查结果: ${allFieldsPresent ? '✅' : '❌'} ${allFieldsPresent ? '所有字段都有值' : `${undefinedCount}个字段缺失`}`);

    console.log('\n🔍 步骤3: 验证数据完整性');
    console.log('-'.repeat(40));

    // 数据完整性检查
    const checks = [
      {
        name: '总佣金是否合理',
        pass: sales?.total_commission >= 0,
        value: sales?.total_commission
      },
      {
        name: '直销佣金是否有值',
        pass: sales?.direct_commission !== undefined && sales?.direct_commission >= 0,
        value: sales?.direct_commission
      },
      {
        name: '平均二级佣金率是否在合理范围',
        pass: sales?.secondary_avg_rate !== undefined && sales?.secondary_avg_rate >= 0 && sales?.secondary_avg_rate <= 1,
        value: `${((sales?.secondary_avg_rate || 0) * 100).toFixed(1)}%`
      },
      {
        name: '二级佣金收益是否有值',
        pass: sales?.secondary_share_commission !== undefined && sales?.secondary_share_commission >= 0,
        value: sales?.secondary_share_commission
      },
      {
        name: '二级订单总额是否有值',
        pass: sales?.secondary_orders_amount !== undefined && sales?.secondary_orders_amount >= 0,
        value: sales?.secondary_orders_amount
      }
    ];

    console.log('数据完整性验证:');
    checks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}: ${check.value}`);
    });

    const passedChecks = checks.filter(c => c.pass).length;
    console.log(`\n验证结果: ${passedChecks}/${checks.length} 项通过`);

    console.log('\n🔧 步骤4: 检查兼容性处理');
    console.log('-'.repeat(40));

    // 检查是否使用了兼容性计算
    console.log('兼容性处理检查:');
    
    if (sales?.direct_commission > 0) {
      const expectedDirectCommission = (sales?.direct_amount || 0) * 0.4;
      const isCalculated = Math.abs((sales?.direct_commission || 0) - expectedDirectCommission) < 0.01;
      console.log(`  直销佣金${isCalculated ? '✅ 已自动计算' : '⚠️ 可能来自数据库字段'}`);
      console.log(`    实际值: $${sales?.direct_commission}`);
      console.log(`    计算值: $${expectedDirectCommission.toFixed(2)}`);
    }

    if (sales?.month_commission > 0) {
      const expectedMonthCommission = (sales?.month_amount || 0) * 0.4;
      const isCalculated = Math.abs((sales?.month_commission || 0) - expectedMonthCommission) < 0.01;
      console.log(`  月度佣金${isCalculated ? '✅ 已自动计算' : '⚠️ 可能来自数据库字段'}`);
      console.log(`    实际值: $${sales?.month_commission}`);
      console.log(`    计算值: $${expectedMonthCommission.toFixed(2)}`);
    }

    console.log('\n📋 步骤5: 页面显示验证');
    console.log('-'.repeat(40));

    // 模拟页面显示的数据映射
    const statsData = {
      totalCommission: stats?.totalCommission || sales?.total_commission || 0,
      monthlyCommission: stats?.monthCommission || stats?.month_commission || 0,
      todayCommission: stats?.todayCommission || stats?.today_commission || 0,
      direct_commission: sales?.direct_commission || stats?.direct_commission || 0,
      secondary_avg_rate: sales?.secondary_avg_rate || stats?.secondary_avg_rate || 0,
      secondary_share_commission: sales?.secondary_share_commission || stats?.secondary_share_commission || 0,
      secondary_orders_amount: sales?.secondary_orders_amount || stats?.secondary_orders_amount || 0
    };

    console.log('页面显示的最终数据:');
    console.log(`  💰 一级销售佣金额: $${statsData.direct_commission}`);
    console.log(`  📊 平均二级佣金率: ${(statsData.secondary_avg_rate * 100).toFixed(1)}%`);
    console.log(`  💵 二级佣金收益额: $${statsData.secondary_share_commission}`);
    console.log(`  📈 二级销售订单总额: $${statsData.secondary_orders_amount}`);

    // 最终结论
    console.log('\n🎯 修复效果总结:');
    console.log('=' .repeat(50));

    if (allFieldsPresent && passedChecks === checks.length) {
      console.log('🎉 修复完全成功！');
      console.log('✅ 所有佣金字段都有正确的值');
      console.log('✅ 数据完整性验证通过');
      console.log('✅ 兼容性处理正常工作');
      console.log('✅ 页面显示将正常工作');
    } else if (passedChecks >= checks.length * 0.8) {
      console.log('✅ 修复基本成功！');
      console.log('⚠️ 部分字段可能需要进一步优化');
      console.log('✅ 页面显示应该正常');
    } else {
      console.log('⚠️ 修复效果有限');
      console.log('❌ 仍有多个字段存在问题');
      console.log('💡 建议检查数据库结构或代码逻辑');
    }

    console.log('\n💡 下一步建议:');
    if (allFieldsPresent) {
      console.log('- 刷新页面验证显示效果');
      console.log('- 测试催单功能是否正常');
      console.log('- 检查其他一级销售是否也正常');
    } else {
      console.log('- 运行 run-fix-commission-fields.js 进行数据库修复');
      console.log('- 或者等待代码兼容性处理生效');
      console.log('- 检查控制台是否还有其他错误');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('详细错误:', error.stack);
  }
}

// 执行测试
testCommissionFieldsFix().catch(console.error);

console.log('💡 提示: 请在一级销售对账页面运行此脚本');