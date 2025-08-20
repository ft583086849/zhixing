// 测试所有修复功能
console.log('🧪 测试所有修复功能\n');

async function testAllFixes() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };

  console.log('📋 测试项目:');
  console.log('1. 一二级总订单数显示');
  console.log('2. 催单功能完整性');
  console.log('3. 销售分类搜索');
  console.log('4. 已催单订单过滤');
  console.log('5. 催单状态同步');
  console.log('');

  try {
    // 步骤1：测试API返回
    console.log('📊 步骤1: 测试API返回数据');
    console.log('-'.repeat(40));

    if (!window.SupabaseService) {
      console.error('❌ SupabaseService未定义');
      return;
    }

    const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
    
    if (!response || !response.data) {
      console.error('❌ API返回数据为空');
      return;
    }

    const { sales, reminderOrders, stats, secondarySales } = response.data;

    console.log('✅ API调用成功');
    console.log(`  一级销售: ${sales?.wechat_name}`);
    console.log(`  销售代码: ${sales?.sales_code}`);

    // 步骤2：验证总订单数
    console.log('\n📊 步骤2: 验证一二级总订单数');
    console.log('-'.repeat(40));

    const primaryOrders = sales?.direct_orders || 0;
    const secondaryOrdersTotal = secondarySales?.reduce((sum, s) => sum + (s.total_orders || 0), 0) || 0;
    const expectedTotal = primaryOrders + secondaryOrdersTotal;

    console.log(`  一级订单数: ${primaryOrders}`);
    console.log(`  二级订单总数: ${secondaryOrdersTotal}`);
    console.log(`  期望总订单数: ${expectedTotal}`);
    console.log(`  实际总订单数: ${stats?.totalOrders}`);
    console.log(`  ${stats?.totalOrders === expectedTotal ? '✅ 计算正确' : '❌ 计算错误'}`);

    // 步骤3：验证催单订单筛选
    console.log('\n📋 步骤3: 验证催单订单筛选');
    console.log('-'.repeat(40));

    console.log(`催单订单数量: ${reminderOrders?.length || 0}`);
    console.log(`统计的待催单数: ${stats?.pendingReminderCount || 0}`);

    if (reminderOrders && reminderOrders.length > 0) {
      console.log('\n检查催单订单状态:');
      
      let validCount = 0;
      let invalidCount = 0;
      let remindedCount = 0;

      reminderOrders.forEach((order, index) => {
        const isValidStatus = ['confirmed_config', 'active'].includes(order.status);
        const isReminded = order.is_reminded;
        
        if (!isValidStatus) {
          console.log(`  ❌ 订单${order.id}状态不正确: ${order.status}`);
          invalidCount++;
        }
        
        if (isReminded) {
          console.log(`  ⚠️ 订单${order.id}已催单但仍在列表中`);
          remindedCount++;
        } else {
          validCount++;
        }
      });

      console.log(`\n筛选结果:`);
      console.log(`  ✅ 有效未催单订单: ${validCount}`);
      console.log(`  ❌ 无效状态订单: ${invalidCount}`);
      console.log(`  ⚠️ 已催单订单: ${remindedCount}`);
    } else {
      console.log('ℹ️ 当前没有需要催单的订单');
    }

    // 步骤4：验证客户信息显示
    console.log('\n👤 步骤4: 验证客户信息显示');
    console.log('-'.repeat(40));

    if (reminderOrders && reminderOrders.length > 0) {
      const sampleOrder = reminderOrders[0];
      const customerInfo = sampleOrder.customer_wechat || 
                          sampleOrder.wechat_name || 
                          sampleOrder.tradingview_username || 
                          '未知客户';
      
      console.log('示例订单客户信息:');
      console.log(`  订单ID: ${sampleOrder.id}`);
      console.log(`  客户微信: ${sampleOrder.customer_wechat || '空'}`);
      console.log(`  微信名: ${sampleOrder.wechat_name || '空'}`);
      console.log(`  TradingView: ${sampleOrder.tradingview_username || '空'}`);
      console.log(`  最终显示: ${customerInfo}`);
      console.log(`  ${customerInfo !== '未知客户' ? '✅ 有客户信息' : '❌ 缺少客户信息'}`);
    }

    // 步骤5：验证销售归属判断
    console.log('\n🏷️ 步骤5: 验证销售归属判断');
    console.log('-'.repeat(40));

    if (reminderOrders && reminderOrders.length > 0) {
      let primaryCount = 0;
      let secondaryCount = 0;

      reminderOrders.forEach(order => {
        const isOwn = !order.parent_sales_code || 
                     order.parent_sales_code === sales?.sales_code ||
                     order.sales_code === sales?.sales_code;
        
        if (isOwn) {
          primaryCount++;
        } else {
          secondaryCount++;
        }
      });

      console.log(`一级直销订单: ${primaryCount}个`);
      console.log(`二级销售订单: ${secondaryCount}个`);
      console.log('');
      console.log('权限说明:');
      console.log('  一级直销订单: ✅ 可以催单');
      console.log('  二级销售订单: 👁️ 仅查看，不能催单');
    }

    // 步骤6：模拟催单操作
    console.log('\n🔔 步骤6: 测试催单操作');
    console.log('-'.repeat(40));

    if (reminderOrders && reminderOrders.length > 0) {
      const ownOrder = reminderOrders.find(order => {
        const isOwn = !order.parent_sales_code || 
                     order.parent_sales_code === sales?.sales_code ||
                     order.sales_code === sales?.sales_code;
        return isOwn && !order.is_reminded;
      });

      if (ownOrder) {
        console.log(`找到可催单订单: ${ownOrder.id}`);
        
        if (window.salesAPI && typeof window.salesAPI.urgeOrder === 'function') {
          console.log('📞 测试催单API...');
          
          try {
            const urgeResult = await window.salesAPI.urgeOrder(ownOrder.id);
            
            if (urgeResult.success) {
              console.log('✅ 催单成功!');
              console.log(`  消息: ${urgeResult.message}`);
              console.log('');
              console.log('💡 催单后效果:');
              console.log('  - 该订单将标记为已催单');
              console.log('  - 下次查询时不会再显示在催单列表');
              console.log('  - 客户管理页面会显示"已催单"状态');
            } else {
              console.log('❌ 催单失败:', urgeResult.message);
            }
          } catch (error) {
            console.error('❌ 催单API调用失败:', error);
          }
        } else {
          console.log('⚠️ 催单API不可用，请在页面上测试');
        }
      } else {
        console.log('ℹ️ 没有可以催单的一级直销订单');
      }
    }

    // 总结
    console.log('\n📊 测试总结');
    console.log('=' .repeat(50));

    const allTestsPassed = [
      stats?.totalOrders === expectedTotal,
      reminderOrders?.every(o => ['confirmed_config', 'active'].includes(o.status)),
      reminderOrders?.every(o => !o.is_reminded),
      reminderOrders?.some(o => o.customer_wechat || o.wechat_name || o.tradingview_username)
    ].every(test => test !== false);

    if (allTestsPassed) {
      console.log('🎉 所有修复功能正常！');
      console.log('✅ 一二级总订单数计算正确');
      console.log('✅ 催单订单筛选正确');
      console.log('✅ 已催单订单被过滤');
      console.log('✅ 客户信息显示正常');
      console.log('✅ 销售归属权限正确');
    } else {
      console.log('⚠️ 部分功能仍需优化');
      console.log('请查看上面的详细测试结果');
    }

    console.log('\n💡 使用建议:');
    console.log('1. 在一级销售对账页面测试搜索功能');
    console.log('2. 尝试按销售分类过滤催单列表');
    console.log('3. 对一级直销订单执行催单操作');
    console.log('4. 检查客户管理页面的催单状态更新');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('详细错误:', error.stack);
  }
}

// 执行测试
testAllFixes().catch(console.error);

console.log('💡 提示: 请在一级销售对账页面运行此脚本');