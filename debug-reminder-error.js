const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

// 模拟前端的 API 调用
const salesAPI = {
  updateOrderReminderStatus: async function(orderId, isReminded) {
    try {
      console.log('🔍 API 调用参数:', { orderId, isReminded });
      
      const { data, error } = await supabase
        .from('orders_optimized')
        .update({ 
          is_reminded: isReminded,
          reminded_at: isReminded ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase 错误:', error);
        return {
          success: false,
          message: error.message || '更新催单状态失败'
        };
      }
      
      console.log('✅ 更新成功，返回数据:', data);
      return {
        success: true,
        data: data,
        message: '催单状态更新成功'
      };
    } catch (error) {
      console.error('❌ 捕获异常:', error);
      return {
        success: false,
        message: error.message || '更新催单状态失败',
        error: error
      };
    }
  }
};

async function debugReminderError() {
  console.log('🐛 调试催单功能错误');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查表结构
    console.log('\n1️⃣ 检查数据库表结构...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('orders_optimized')
      .select('id, is_reminded, reminded_at')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ 表结构问题:', schemaError.message);
      console.log('   错误代码:', schemaError.code);
      console.log('   完整错误:', JSON.stringify(schemaError, null, 2));
      
      console.log('\n💡 解决方案: 需要在数据库执行以下SQL:');
      console.log('ALTER TABLE orders_optimized ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT false;');
      console.log('ALTER TABLE orders_optimized ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMP WITH TIME ZONE;');
      return;
    }
    
    console.log('✅ 表结构正常，字段存在');
    
    // 2. 找一个测试订单
    console.log('\n2️⃣ 查找测试订单...');
    const { data: orders, error: findError } = await supabase
      .from('orders_optimized')
      .select('id, customer_wechat, sales_code, status')
      .in('status', ['confirmed_config', 'active'])
      .limit(5);
    
    if (findError) {
      console.log('❌ 查询订单失败:', findError.message);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ 没有找到可测试的订单');
      return;
    }
    
    console.log(`✅ 找到 ${orders.length} 个订单可供测试`);
    const testOrder = orders[0];
    console.log('   使用订单ID:', testOrder.id);
    console.log('   客户:', testOrder.customer_wechat);
    console.log('   销售代码:', testOrder.sales_code);
    
    // 3. 测试直接更新
    console.log('\n3️⃣ 测试直接数据库更新...');
    const { data: directUpdate, error: directError } = await supabase
      .from('orders_optimized')
      .update({ 
        is_reminded: true,
        reminded_at: new Date().toISOString()
      })
      .eq('id', testOrder.id)
      .select()
      .single();
    
    if (directError) {
      console.log('❌ 直接更新失败:', directError.message);
      console.log('   错误详情:', JSON.stringify(directError, null, 2));
    } else {
      console.log('✅ 直接更新成功');
      console.log('   更新后的数据:', {
        id: directUpdate.id,
        is_reminded: directUpdate.is_reminded,
        reminded_at: directUpdate.reminded_at
      });
      
      // 恢复状态
      await supabase
        .from('orders_optimized')
        .update({ is_reminded: false, reminded_at: null })
        .eq('id', testOrder.id);
    }
    
    // 4. 测试 API 函数
    console.log('\n4️⃣ 测试 API 函数调用...');
    const apiResult = await salesAPI.updateOrderReminderStatus(testOrder.id, true);
    
    if (apiResult.success) {
      console.log('✅ API 调用成功');
      console.log('   返回消息:', apiResult.message);
      
      // 验证更新
      const { data: verify } = await supabase
        .from('orders_optimized')
        .select('is_reminded, reminded_at')
        .eq('id', testOrder.id)
        .single();
      
      console.log('   验证结果:', {
        is_reminded: verify.is_reminded,
        reminded_at: verify.reminded_at
      });
      
      // 恢复状态
      await supabase
        .from('orders_optimized')
        .update({ is_reminded: false, reminded_at: null })
        .eq('id', testOrder.id);
    } else {
      console.log('❌ API 调用失败');
      console.log('   错误消息:', apiResult.message);
      if (apiResult.error) {
        console.log('   错误详情:', apiResult.error);
      }
    }
    
    // 5. 权限检查
    console.log('\n5️⃣ 检查权限...');
    const { data: permTest, error: permError } = await supabase
      .from('orders_optimized')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testOrder.id)
      .select();
    
    if (permError) {
      console.log('❌ 可能存在权限问题:', permError.message);
    } else {
      console.log('✅ 更新权限正常');
    }
    
    // 6. 总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 诊断结果:');
    
    if (!schemaError && !directError && apiResult.success) {
      console.log('✅ 所有测试通过，催单功能应该正常工作');
      console.log('\n可能的问题:');
      console.log('1. 前端传递的订单ID不正确');
      console.log('2. 网络连接问题');
      console.log('3. 浏览器缓存问题（尝试清除缓存）');
    } else {
      console.log('❌ 发现问题:');
      if (schemaError) console.log('- 数据库缺少必要字段');
      if (directError) console.log('- 数据库更新权限问题');
      if (!apiResult.success) console.log('- API 函数有问题');
    }
    
    console.log('\n💡 建议:');
    console.log('1. 确认已在 Supabase 控制台执行了添加字段的 SQL');
    console.log('2. 检查浏览器控制台是否有具体错误信息');
    console.log('3. 尝试刷新页面后重试');
    
  } catch (err) {
    console.error('\n❌ 调试过程出错:', err);
  }
}

// 执行调试
debugReminderError().catch(console.error);