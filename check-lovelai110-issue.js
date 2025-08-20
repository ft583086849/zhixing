/**
 * 检查lovelai110订单问题
 * 为什么点了两次配置确认还是pending状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrder() {
  console.log('========================================');
  console.log('检查 lovelai110 订单问题');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    // 1. 在两个表中查找这个订单
    console.log('【1. 查找订单】');
    console.log('----------------------------------------');
    
    // 查询orders表
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('tradingview_username', 'lovelai110');
    
    // 查询orders_optimized表
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('tradingview_username', 'lovelai110');
    
    console.log(`orders表中找到: ${ordersData?.length || 0} 条`);
    console.log(`orders_optimized表中找到: ${optimizedData?.length || 0} 条`);
    
    // 2. 显示详细信息
    if (optimizedData && optimizedData.length > 0) {
      console.log('\n【2. orders_optimized表中的订单详情】');
      console.log('----------------------------------------');
      
      optimizedData.forEach(order => {
        console.log(`\n订单ID: ${order.id}`);
        console.log(`用户名: ${order.tradingview_username}`);
        console.log(`状态: ${order.status}`);
        console.log(`创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log(`更新时间: ${order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : '无'}`);
        console.log(`配置时间: ${order.config_time ? new Date(order.config_time).toLocaleString('zh-CN') : '空'}`);
        console.log(`持续时间: ${order.duration}`);
        console.log(`销售代码: ${order.sales_code}`);
        
        // 分析问题
        console.log('\n问题分析：');
        if (order.status === 'pending') {
          console.log('❌ 订单仍然是pending状态');
          console.log('可能原因：');
          console.log('1. 更新操作没有成功执行');
          console.log('2. 页面可能在查询旧的orders表而不是orders_optimized表');
          console.log('3. 前端缓存问题');
        } else if (order.status === 'confirmed_config') {
          console.log('✅ 订单已经是confirmed_config状态');
          console.log('但页面可能显示有问题，建议刷新页面');
        }
      });
    }
    
    // 3. 检查orders表的状态
    if (ordersData && ordersData.length > 0) {
      console.log('\n【3. orders表中的订单状态】');
      console.log('----------------------------------------');
      
      ordersData.forEach(order => {
        console.log(`订单ID: ${order.id}`);
        console.log(`状态: ${order.status}`);
        console.log(`配置时间: ${order.config_time ? new Date(order.config_time).toLocaleString('zh-CN') : '空'}`);
      });
    }
    
    // 4. 尝试手动更新
    console.log('\n【4. 尝试手动修复】');
    console.log('----------------------------------------');
    
    if (optimizedData && optimizedData.length > 0) {
      const order = optimizedData[0];
      
      if (order.status === 'pending') {
        console.log('正在手动更新订单状态...');
        
        const { data: updateResult, error: updateError } = await supabase
          .from('orders_optimized')
          .update({
            status: 'confirmed_config',
            config_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .select();
        
        if (updateError) {
          console.error('❌ 更新失败:', updateError.message);
          console.log('\n错误详情:');
          console.log(JSON.stringify(updateError, null, 2));
        } else {
          console.log('✅ 手动更新成功！');
          console.log('新状态:', updateResult[0].status);
          console.log('配置时间:', new Date(updateResult[0].config_time).toLocaleString('zh-CN'));
        }
      } else {
        console.log('订单已经不是pending状态，无需更新');
        console.log('当前状态:', order.status);
      }
    }
    
    // 5. 验证最终状态
    console.log('\n【5. 验证最终状态】');
    console.log('----------------------------------------');
    
    const { data: finalCheck } = await supabase
      .from('orders_optimized')
      .select('id, status, config_time')
      .eq('tradingview_username', 'lovelai110')
      .single();
    
    if (finalCheck) {
      console.log('最终状态:');
      console.log(`订单ID: ${finalCheck.id}`);
      console.log(`状态: ${finalCheck.status}`);
      console.log(`配置时间: ${finalCheck.config_time ? new Date(finalCheck.config_time).toLocaleString('zh-CN') : '空'}`);
      
      if (finalCheck.status === 'confirmed_config') {
        console.log('\n✅✅✅ 问题已解决！');
        console.log('请刷新页面查看最新状态');
      }
    }
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 执行检查
checkOrder();