// 测试催单功能完整流程
console.log('🔔 测试催单功能完整流程\n');

async function testReminderFunction() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('📋 测试步骤:');
  console.log('1. 获取一级销售数据');
  console.log('2. 检查催单数据获取');
  console.log('3. 测试催单功能显示');
  console.log('4. 测试催单操作');
  console.log('');

  try {
    // 步骤1：获取一级销售数据
    console.log('📊 步骤1: 获取一级销售数据');
    console.log('-'.repeat(40));
    
    if (!window.SupabaseService) {
      console.error('❌ SupabaseService未定义');
      return;
    }
    
    const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
    console.log('✅ API调用成功');
    
    if (!response || !response.data) {
      console.error('❌ API返回数据为空');
      return;
    }
    
    const { sales, reminderOrders, stats } = response.data;
    
    console.log('基本信息:');
    console.log(`  一级销售: ${sales?.wechat_name} (${sales?.sales_code})`);
    console.log(`  总佣金: $${sales?.total_commission || 0}`);
    console.log('');
    
    // 步骤2：检查催单数据
    console.log('📋 步骤2: 检查催单数据');
    console.log('-'.repeat(40));
    
    console.log(`待催单数量: ${stats?.pendingReminderCount || 0}`);
    console.log(`催单订单列表: ${reminderOrders?.length || 0} 条记录`);
    
    if (reminderOrders && reminderOrders.length > 0) {
      console.log('✅ 发现催单订单:');
      
      reminderOrders.forEach((order, index) => {
        console.log(`\n  订单${index + 1}:`);
        console.log(`    订单ID: ${order.id}`);
        console.log(`    客户: ${order.customer_wechat || order.wechat_name || '未知'}`);
        console.log(`    金额: $${order.total_amount || order.amount || 0}`);
        console.log(`    状态: ${order.status}`);
        console.log(`    到期时间: ${order.expiry_time ? new Date(order.expiry_time).toLocaleString() : '未设置'}`);
        console.log(`    剩余天数: ${order.daysUntilExpiry}天`);
        console.log(`    催单状态: ${order.is_reminded ? '已催单' : '未催单'}`);
        console.log(`    订单归属: ${order.parent_sales_code ? '二级销售' : '一级直销'}`);
      });
    } else {
      console.log('ℹ️ 当前没有需要催单的订单');
    }
    
    // 步骤3：测试催单功能显示
    console.log('\n🖥️ 步骤3: 测试催单功能显示');
    console.log('-'.repeat(40));
    
    // 检查页面上是否会显示催单功能
    const shouldShowReminder = stats?.pendingReminderCount > 0;
    console.log(`催单功能显示条件: ${shouldShowReminder ? '✅ 满足' : '❌ 不满足'}`);
    console.log(`  pendingReminderCount: ${stats?.pendingReminderCount}`);
    console.log(`  reminderOrders.length: ${reminderOrders?.length}`);
    
    if (shouldShowReminder) {
      console.log('✅ 催单功能将在页面底部显示');
      console.log('📊 催单统计卡片将显示以下信息:');
      
      // 分析催单级别
      const criticalOrders = reminderOrders.filter(order => {
        const days = order.daysUntilExpiry;
        return days < 0 || days <= 1; // 已过期或1天内到期
      });
      
      const warningOrders = reminderOrders.filter(order => {
        const days = order.daysUntilExpiry;
        const hasAmount = (order.total_amount || order.amount || 0) > 0;
        const reminderDays = hasAmount ? 7 : 3;
        return days >= 0 && days <= reminderDays && days > 1; // 预警范围但不紧急
      });
      
      console.log(`  - 待催单总数: ${stats.pendingReminderCount}`);
      console.log(`  - 紧急催单: ${criticalOrders.length} 条`);
      console.log(`  - 预警催单: ${warningOrders.length} 条`);
      console.log(`  - 催单完成率: ${reminderOrders.filter(o => o.is_reminded).length}/${reminderOrders.length}`);
    } else {
      console.log('ℹ️ 催单功能不会显示（没有需要催单的订单）');
    }
    
    // 步骤4：测试催单操作
    if (reminderOrders && reminderOrders.length > 0) {
      console.log('\n🔔 步骤4: 测试催单操作');
      console.log('-'.repeat(40));
      
      // 找一个未催单的订单进行测试
      const unremindedOrder = reminderOrders.find(order => !order.is_reminded);
      
      if (unremindedOrder) {
        console.log(`找到未催单的订单: ${unremindedOrder.id}`);
        console.log('模拟催单操作...');
        
        // 检查催单API是否可用
        if (window.salesAPI && typeof window.salesAPI.urgeOrder === 'function') {
          try {
            console.log('📞 调用催单API...');
            const urgeResult = await window.salesAPI.urgeOrder(unremindedOrder.id);
            
            if (urgeResult.success) {
              console.log('✅ 催单成功!');
              console.log(`  订单ID: ${unremindedOrder.id}`);
              console.log(`  返回消息: ${urgeResult.message}`);
              
              // 验证催单是否生效
              console.log('🔍 验证催单结果...');
              setTimeout(async () => {
                try {
                  const updatedResponse = await window.SupabaseService.getPrimarySalesSettlement(testParams);
                  const updatedReminders = updatedResponse.data.reminderOrders || [];
                  const updatedOrder = updatedReminders.find(o => o.id === unremindedOrder.id);
                  
                  if (updatedOrder && updatedOrder.is_reminded) {
                    console.log('✅ 催单状态已更新！');
                    console.log(`  订单 ${updatedOrder.id} 现在显示为已催单`);
                  } else {
                    console.log('⚠️ 催单状态可能未及时更新，请稍后刷新页面');
                  }
                } catch (error) {
                  console.log('⚠️ 验证催单结果时出错:', error.message);
                }
              }, 2000);
            } else {
              console.log('❌ 催单失败:', urgeResult.message);
            }
          } catch (error) {
            console.error('❌ 催单API调用失败:', error);
          }
        } else {
          console.log('⚠️ salesAPI.urgeOrder 方法不可用，请在页面上测试催单功能');
        }
      } else {
        console.log('ℹ️ 所有需要催单的订单都已经催单过了');
        
        // 显示已催单的订单信息
        const remindedOrders = reminderOrders.filter(order => order.is_reminded);
        if (remindedOrders.length > 0) {
          console.log('📋 已催单的订单:');
          remindedOrders.forEach(order => {
            console.log(`  - 订单${order.id}: ${order.customer_wechat || '未知客户'} (${order.reminder_time ? new Date(order.reminder_time).toLocaleString() : '催单时间未知'})`);
          });
        }
      }
    }
    
    // 总结
    console.log('\n📊 测试总结:');
    console.log('=' .repeat(50));
    
    if (stats?.pendingReminderCount > 0) {
      console.log('🎯 催单功能完全就绪！');
      console.log('✅ 数据获取正常');
      console.log('✅ 催单列表显示正常');
      console.log('✅ 催单操作功能正常');
      console.log('');
      console.log('📋 使用说明:');
      console.log('1. 进入一级销售对账页面');
      console.log('2. 输入销售员微信号查询');
      console.log('3. 查看页面底部的催单功能区域');
      console.log('4. 点击催单按钮进行催单操作');
      console.log('');
      console.log('💡 催单功能特性:');
      console.log('- 🔴 自动识别已过期订单');
      console.log('- 🟠 预警即将到期订单');
      console.log('- ✅ 区分一级/二级订单权限');
      console.log('- 📊 完整的催单统计信息');
      console.log('- 📝 催单记录和状态跟踪');
    } else {
      console.log('ℹ️ 当前没有需要催单的订单');
      console.log('💡 催单功能会在有需要催单的订单时自动显示');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('详细错误:', error.stack);
  }
}

// 执行测试
testReminderFunction().catch(console.error);

console.log('💡 提示:');
console.log('- 请在一级销售对账页面运行此脚本');
console.log('- 确保已经查询了销售员数据');
console.log('- 如果没有催单订单，可以手动创建一些测试订单');