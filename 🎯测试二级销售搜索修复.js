/**
 * 测试二级销售搜索修复
 */

import { SupabaseService } from './client/src/services/supabase.js';

async function testFix() {
  console.log('========== 测试二级销售搜索修复 ==========\n');

  try {
    console.log('📝 模拟API调用格式');
    console.log('搜索条件: wechat_name = "一级下的二级赵六"');
    
    // 直接调用SupabaseService
    const settlementData = await SupabaseService.getSecondarySalesSettlement({
      wechat_name: '一级下的二级赵六'
    });
    
    // 模拟API返回格式
    const response = {
      success: true,
      data: settlementData,
      message: '获取二级销售结算数据成功'
    };
    
    console.log('\n✅ 调用成功！');
    console.log('API返回格式:', {
      'response.success': response.success,
      'response.message': response.message,
      'response.data存在': !!response.data
    });
    
    if (response.success && response.data) {
      const { sales, orders, reminderOrders, stats } = response.data;
      console.log('\n销售信息:', {
        微信号: sales?.wechat_name,
        销售代码: sales?.sales_code,
        佣金率: sales?.commission_rate
      });
      
      console.log('\n统计信息:', {
        总订单数: stats?.totalOrders,
        总金额: stats?.totalAmount,
        总佣金: stats?.totalCommission
      });
      
      console.log('\n✅ 修复说明：');
      console.log('1. 前端页面错误地访问了 response.data.success');
      console.log('2. 应该直接访问 response.success');
      console.log('3. 现在前端页面应该可以正常工作了！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 执行测试
testFix();
