/**
 * 诊断销售搜索功能问题
 * 
 * 问题描述：
 * 1. 一级销售对账页面搜索"张三"显示"未匹配到"
 * 2. 二级销售对账页面搜索"王五"显示"未匹配到"
 * 
 * 需要检查：
 * 1. 数据库中实际的销售数据
 * 2. 视图中的数据
 * 3. 搜索逻辑是否正确
 */

import { supabase } from './client/src/services/supabase.js';

async function diagnoseSearchIssue() {
  console.log('========== 开始诊断销售搜索问题 ==========\n');

  try {
    // 1. 检查一级销售表中的所有数据
    console.log('📋 一级销售表 (primary_sales) 中的所有数据：');
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('id, wechat_name, name, sales_code, phone')
      .order('created_at', { ascending: false });

    if (primaryError) {
      console.error('❌ 查询一级销售表失败:', primaryError);
    } else {
      console.log(`找到 ${primarySales.length} 个一级销售：`);
      primarySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. 微信号: "${sale.wechat_name}", 姓名: "${sale.name}", 销售代码: ${sale.sales_code}`);
      });
      
      // 检查是否有"张三"
      const zhangsan = primarySales.find(s => 
        s.wechat_name === '张三' || 
        s.name === '张三' ||
        s.wechat_name?.includes('张三') ||
        s.name?.includes('张三')
      );
      if (zhangsan) {
        console.log(`\n✅ 找到"张三": 微信号="${zhangsan.wechat_name}", 姓名="${zhangsan.name}", sales_code="${zhangsan.sales_code}"`);
      } else {
        console.log('\n⚠️  在一级销售表中没有找到"张三"');
      }
    }

    console.log('\n-------------------------------------------\n');

    // 2. 检查二级销售表中的所有数据
    console.log('📋 二级销售表 (secondary_sales) 中的所有数据：');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('id, wechat_name, name, sales_code, phone, primary_sales_id')
      .order('created_at', { ascending: false });

    if (secondaryError) {
      console.error('❌ 查询二级销售表失败:', secondaryError);
    } else {
      console.log(`找到 ${secondarySales.length} 个二级销售：`);
      secondarySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. 微信号: "${sale.wechat_name}", 姓名: "${sale.name}", 销售代码: ${sale.sales_code}, 上级ID: ${sale.primary_sales_id || '无'}`);
      });
      
      // 检查是否有"王五"
      const wangwu = secondarySales.find(s => 
        s.wechat_name === '王五' || 
        s.name === '王五' ||
        s.wechat_name?.includes('王五') ||
        s.name?.includes('王五')
      );
      if (wangwu) {
        console.log(`\n✅ 找到"王五": 微信号="${wangwu.wechat_name}", 姓名="${wangwu.name}", sales_code="${wangwu.sales_code}"`);
      } else {
        console.log('\n⚠️  在二级销售表中没有找到"王五"');
      }
    }

    console.log('\n-------------------------------------------\n');

    // 3. 检查一级销售统计视图
    console.log('📊 一级销售统计视图 (primary_sales_stats) 数据：');
    const { data: primaryStats, error: primaryStatsError } = await supabase
      .from('primary_sales_stats')
      .select('wechat_name, sales_code, total_orders, total_amount')
      .order('total_amount', { ascending: false });

    if (primaryStatsError) {
      console.error('❌ 查询一级销售统计视图失败:', primaryStatsError);
      console.log('提示: 视图可能不存在，需要创建');
    } else {
      console.log(`视图中有 ${primaryStats?.length || 0} 条数据`);
      primaryStats?.forEach((stat, index) => {
        console.log(`  ${index + 1}. 微信号: "${stat.wechat_name}", 销售代码: ${stat.sales_code}, 订单数: ${stat.total_orders}, 总金额: $${stat.total_amount}`);
      });
    }

    console.log('\n-------------------------------------------\n');

    // 4. 检查二级销售统计视图
    console.log('📊 二级销售统计视图 (secondary_sales_stats) 数据：');
    const { data: secondaryStats, error: secondaryStatsError } = await supabase
      .from('secondary_sales_stats')
      .select('wechat_name, sales_code, total_orders, total_amount')
      .order('total_amount', { ascending: false });

    if (secondaryStatsError) {
      console.error('❌ 查询二级销售统计视图失败:', secondaryStatsError);
      console.log('提示: 视图可能不存在，需要创建');
    } else {
      console.log(`视图中有 ${secondaryStats?.length || 0} 条数据`);
      secondaryStats?.forEach((stat, index) => {
        console.log(`  ${index + 1}. 微信号: "${stat.wechat_name}", 销售代码: ${stat.sales_code}, 订单数: ${stat.total_orders}, 总金额: $${stat.total_amount}`);
      });
    }

    console.log('\n-------------------------------------------\n');

    // 5. 模拟前端的搜索请求
    console.log('🔍 模拟前端搜索请求：');
    
    // 搜索"张三"
    console.log('\n搜索一级销售"张三"...');
    const { data: zhangSanResult, error: zhangSanError } = await supabase
      .from('primary_sales_stats')
      .select('*')
      .eq('wechat_name', '张三')
      .single();
    
    if (zhangSanError) {
      console.log(`❌ 搜索"张三"失败: ${zhangSanError.message}`);
    } else {
      console.log(`✅ 搜索"张三"成功:`, zhangSanResult);
    }

    // 搜索"王五"
    console.log('\n搜索二级销售"王五"...');
    const { data: wangWuResult, error: wangWuError } = await supabase
      .from('secondary_sales_stats')
      .select('*')
      .eq('wechat_name', '王五')
      .single();
    
    if (wangWuError) {
      console.log(`❌ 搜索"王五"失败: ${wangWuError.message}`);
    } else {
      console.log(`✅ 搜索"王五"成功:`, wangWuResult);
    }

    console.log('\n========== 诊断结果总结 ==========\n');
    console.log('可能的问题原因：');
    console.log('1. 数据库中销售的微信号字段可能不是"张三"或"王五"（可能在name字段中）');
    console.log('2. 视图可能不存在或者没有正确同步数据');
    console.log('3. 搜索使用的是精确匹配(eq)，而不是模糊匹配(ilike)');
    console.log('4. 可能存在空格或其他不可见字符');
    
    console.log('\n建议的解决方案：');
    console.log('1. 确保视图存在并正确创建');
    console.log('2. 考虑在搜索时同时搜索wechat_name和name字段');
    console.log('3. 考虑使用模糊匹配(ilike)而不是精确匹配(eq)');
    console.log('4. 在搜索前trim()去除空格');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  }
}

// 执行诊断
diagnoseSearchIssue();
