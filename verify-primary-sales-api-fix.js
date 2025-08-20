/**
 * 验证一级销售对账API修复
 * 测试API返回结构是否包含完整的v2.0佣金字段
 */

import { SupabaseService } from './client/src/services/supabase.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证一级销售对账API修复');
console.log('=' .repeat(50));

async function verifyAPIMix() {
  try {
    // 使用测试数据调用API
    const testParams = {
      wechat_name: 'wml'  // 使用一个已知的一级销售
    };
    
    console.log('📞 调用API: getPrimarySalesSettlement');
    console.log('参数:', testParams);
    console.log('');
    
    const response = await SupabaseService.getPrimarySalesSettlement(testParams);
    
    console.log('✅ API调用成功');
    console.log('');
    
    // 检查返回结构
    console.log('📋 返回数据结构检查:');
    console.log('response.sales:', !!response.sales);
    console.log('response.orders:', !!response.orders);
    console.log('response.secondarySales:', !!response.secondarySales);
    console.log('response.stats:', !!response.stats);
    console.log('');
    
    if (!response.sales) {
      console.log('❌ 错误: sales 对象不存在');
      return;
    }
    
    // 检查v2.0佣金字段完整性
    console.log('🔍 v2.0佣金字段检查:');
    const requiredFields = [
      'total_commission',
      'direct_commission', 
      'secondary_avg_rate',
      'secondary_share_commission',
      'secondary_orders_amount',
      'month_commission',
      'today_commission'
    ];
    
    let allFieldsPresent = true;
    requiredFields.forEach(field => {
      const exists = field in response.sales;
      const value = response.sales[field];
      console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? (typeof value === 'number' ? value.toFixed(2) : value) : '不存在'}`);
      if (!exists) allFieldsPresent = false;
    });
    
    console.log('');
    
    if (allFieldsPresent) {
      console.log('🎯 验证结果: ✅ 修复成功！');
      console.log('   所有v2.0佣金字段都已添加到 sales 对象中');
      console.log('   一级销售对账页面现在将显示正确的数据');
    } else {
      console.log('❌ 验证结果: 修复不完整');
      console.log('   仍有字段缺失，需要进一步修复');
    }
    
    // 显示佣金计算详情
    if (response.sales.total_commission !== undefined) {
      console.log('');
      console.log('📊 佣金计算详情:');
      console.log(`   一级直销佣金: $${(response.sales.direct_commission || 0).toFixed(2)}`);
      console.log(`   二级分销收益: $${(response.sales.secondary_share_commission || 0).toFixed(2)}`);
      console.log(`   总佣金收入: $${(response.sales.total_commission || 0).toFixed(2)}`);
      console.log(`   平均二级佣金率: ${((response.sales.secondary_avg_rate || 0) * 100).toFixed(2)}%`);
      console.log(`   二级订单总额: $${(response.sales.secondary_orders_amount || 0).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    console.log('');
    console.log('可能的原因:');
    console.log('1. 数据库连接问题');
    console.log('2. 测试销售不存在');
    console.log('3. 权限问题');
    console.log('');
    console.log('建议检查:');
    console.log('- Supabase连接配置');
    console.log('- 数据库中是否存在 wml 销售');
    console.log('- sales_optimized 表结构');
  }
}

// 执行验证
verifyAPIMix().then(() => {
  console.log('\n✨ 验证完成');
}).catch(error => {
  console.error('验证过程发生错误:', error);
});