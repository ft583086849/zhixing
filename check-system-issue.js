/**
 * 检查系统性问题
 * 为什么配置确认后状态没有更新
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSystemIssue() {
  console.log('========================================');
  console.log('系统性问题诊断');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    // 1. 检查两表的数据同步情况
    console.log('【1. 数据同步状态对比】');
    console.log('----------------------------------------');
    
    // 获取所有pending状态的订单
    const { data: ordersPending } = await supabase
      .from('orders')
      .select('id, tradingview_username, status, config_time')
      .eq('status', 'pending');
    
    const { data: optimizedPending } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, status, config_time')
      .eq('status', 'pending');
    
    const { data: optimizedConfirmed } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, status, config_time')
      .eq('status', 'confirmed_config')
      .order('config_time', { ascending: false })
      .limit(10);
    
    console.log(`orders表 pending: ${ordersPending?.length || 0} 个`);
    console.log(`orders_optimized表 pending: ${optimizedPending?.length || 0} 个`);
    console.log(`orders_optimized表最近确认的: ${optimizedConfirmed?.length || 0} 个`);
    
    // 2. 分析不一致的数据
    console.log('\n【2. 数据不一致分析】');
    console.log('----------------------------------------');
    
    if (optimizedConfirmed && optimizedConfirmed.length > 0) {
      console.log('最近已确认的订单（orders_optimized表）：');
      optimizedConfirmed.forEach(order => {
        console.log(`  ID ${order.id}: ${order.tradingview_username} - 确认时间: ${order.config_time ? new Date(order.config_time).toLocaleString('zh-CN') : '无'}`);
      });
      
      // 检查这些订单在orders表中的状态
      const confirmedIds = optimizedConfirmed.map(o => o.id);
      const { data: ordersStatus } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', confirmedIds);
      
      console.log('\n这些订单在orders表中的状态：');
      ordersStatus?.forEach(order => {
        console.log(`  ID ${order.id}: ${order.status}`);
      });
      
      // 分析问题
      const problemOrders = ordersStatus?.filter(o => o.status === 'pending');
      if (problemOrders && problemOrders.length > 0) {
        console.log('\n❌ 发现问题：');
        console.log(`${problemOrders.length} 个订单在orders_optimized表中是confirmed_config`);
        console.log('但在orders表中仍然是pending状态！');
      }
    }
    
    // 3. 检查页面查询的是哪个表
    console.log('\n【3. 问题根源分析】');
    console.log('----------------------------------------');
    console.log('可能的问题：');
    console.log('1. ❌ 页面显示数据来自orders表（旧表）');
    console.log('2. ❌ 更新操作更新的是orders_optimized表');
    console.log('3. ❌ 两表数据不同步导致显示错误');
    
    // 4. 提供解决方案
    console.log('\n【4. 立即修复方案】');
    console.log('----------------------------------------');
    console.log('方案1: 同步两表数据');
    
    // 获取需要同步的订单
    const { data: needSync } = await supabase
      .from('orders_optimized')
      .select('id, status, config_time')
      .eq('status', 'confirmed_config');
    
    if (needSync && needSync.length > 0) {
      console.log(`\n需要同步 ${needSync.length} 个已确认订单到orders表`);
      console.log('执行同步...\n');
      
      let syncCount = 0;
      for (const order of needSync) {
        const { error } = await supabase
          .from('orders')
          .update({
            status: order.status,
            config_time: order.config_time,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        if (!error) {
          syncCount++;
          console.log(`✅ 同步订单 ${order.id}`);
        } else {
          console.log(`❌ 同步订单 ${order.id} 失败: ${error.message}`);
        }
      }
      
      console.log(`\n同步完成：成功 ${syncCount}/${needSync.length} 个`);
    }
    
    // 5. 验证修复结果
    console.log('\n【5. 验证修复结果】');
    console.log('----------------------------------------');
    
    const { data: finalOrdersPending } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending');
    
    const { data: finalOptimizedPending } = await supabase
      .from('orders_optimized')
      .select('id')
      .eq('status', 'pending');
    
    console.log(`修复后：`);
    console.log(`orders表 pending: ${finalOrdersPending?.length || 0} 个`);
    console.log(`orders_optimized表 pending: ${finalOptimizedPending?.length || 0} 个`);
    
    if (finalOrdersPending?.length === finalOptimizedPending?.length) {
      console.log('\n✅ 两表数据已同步！');
    } else {
      console.log('\n⚠️ 两表数据仍有差异');
    }
    
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

// 执行诊断
checkSystemIssue();