/**
 * 诊断二级销售对账页面搜索失败问题
 * 
 * 问题：搜索"一级下的二级赵六"查询失败
 */

import { supabase, SupabaseService } from './client/src/services/supabase.js';

async function diagnoseSearchProblem() {
  console.log('========== 诊断二级销售搜索失败问题 ==========\n');

  try {
    // 1. 检查数据库中是否有赵六的数据
    console.log('📋 步骤1: 检查数据库中赵六的数据');
    const { data: zhaoliu, error: zhaoliuError } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('name', '赵六')
      .single();

    if (zhaoliuError) {
      console.error('❌ 查询赵六失败:', zhaoliuError);
    } else {
      console.log('✅ 找到赵六的数据:');
      console.log('  - ID:', zhaoliu.id);
      console.log('  - 微信号:', zhaoliu.wechat_name);
      console.log('  - 姓名:', zhaoliu.name);
      console.log('  - 销售代码:', zhaoliu.sales_code);
      console.log('  - 上级ID:', zhaoliu.primary_sales_id);
    }

    console.log('\n-------------------------------------------\n');

    // 2. 测试直接用微信号查询
    console.log('📋 步骤2: 直接用微信号精确查询');
    const { data: exactMatch, error: exactError } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('wechat_name', '一级下的二级赵六')
      .single();

    if (exactError) {
      console.error('❌ 精确查询失败:', exactError);
    } else {
      console.log('✅ 精确查询成功，找到了赵六');
    }

    console.log('\n-------------------------------------------\n');

    // 3. 测试SupabaseService.getSecondarySalesSettlement
    console.log('📋 步骤3: 测试SupabaseService.getSecondarySalesSettlement()');
    
    try {
      const result = await SupabaseService.getSecondarySalesSettlement({
        wechat_name: '一级下的二级赵六'
      });
      
      console.log('✅ SupabaseService调用成功！');
      console.log('返回的销售信息:', {
        微信号: result.sales.wechat_name,
        销售代码: result.sales.sales_code
      });
    } catch (error) {
      console.error('❌ SupabaseService调用失败:', error.message);
      console.error('错误详情:', error);
    }



    console.log('\n-------------------------------------------\n');

    // 5. 检查是否有其他同名销售
    console.log('📋 步骤5: 检查是否有其他包含"赵六"的销售');
    const { data: allZhaoliu, error: allError } = await supabase
      .from('secondary_sales')
      .select('wechat_name, name, sales_code')
      .or('wechat_name.ilike.%赵六%,name.ilike.%赵六%');

    if (!allError && allZhaoliu) {
      console.log(`找到 ${allZhaoliu.length} 个包含"赵六"的销售:`);
      allZhaoliu.forEach((s, i) => {
        console.log(`  ${i + 1}. 微信号: "${s.wechat_name}", 姓名: "${s.name}", 代码: ${s.sales_code}`);
      });
    }

    console.log('\n========== 诊断总结 ==========\n');
    console.log('问题可能原因：');
    console.log('1. 前端页面可能缓存了旧代码');
    console.log('2. API响应格式可能不匹配（response.data.success vs 直接返回数据）');
    console.log('3. 网络或CORS问题');
    console.log('\n建议：');
    console.log('1. 强制刷新页面（Ctrl+Shift+R）');
    console.log('2. 清除浏览器缓存');
    console.log('3. 检查浏览器控制台的网络请求');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  }
}

// 执行诊断
diagnoseSearchProblem();
