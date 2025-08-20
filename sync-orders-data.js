/**
 * 同步orders表数据到orders_optimized表
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncOrdersData() {
  console.log('========================================');
  console.log('开始同步订单数据');
  console.log('========================================\n');

  try {
    // 1. 获取orders表中最新的数据（orders_optimized表没有的）
    console.log('【步骤1: 查找需要同步的订单】');
    console.log('----------------------------------------');
    
    // 获取orders_optimized表的最大ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    const maxOptimizedId = maxIdData ? maxIdData.id : 0;
    console.log(`orders_optimized表最大ID: ${maxOptimizedId}`);
    
    // 获取orders表中ID大于maxOptimizedId的记录
    const { data: ordersToSync, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gt('id', maxOptimizedId)
      .order('id', { ascending: true });
    
    if (ordersError) {
      console.error('获取待同步订单失败:', ordersError);
      return;
    }
    
    console.log(`找到 ${ordersToSync.length} 条需要同步的订单\n`);
    
    if (ordersToSync.length === 0) {
      console.log('✅ 没有需要同步的数据，两表已经一致');
      return;
    }
    
    // 显示待同步的订单
    console.log('待同步订单列表:');
    ordersToSync.forEach(order => {
      console.log(`  ID: ${order.id}`);
      console.log(`    用户: ${order.tradingview_username}`);
      console.log(`    时长: ${order.duration}`);
      console.log(`    金额: ${order.amount}`);
      console.log(`    状态: ${order.status}`);
      console.log(`    时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      console.log();
    });
    
    // 2. 同步数据到orders_optimized
    console.log('【步骤2: 同步数据到orders_optimized表】');
    console.log('----------------------------------------');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const order of ordersToSync) {
      // 准备数据，确保字段匹配
      const optimizedOrder = {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        customer_wechat: order.customer_wechat,
        tradingview_username: order.tradingview_username,
        amount: order.amount,
        actual_payment_amount: order.actual_payment_amount,
        alipay_amount: order.alipay_amount,
        crypto_amount: order.crypto_amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        payment_time: order.payment_time,
        duration: order.duration,
        purchase_type: order.purchase_type,
        status: order.status,
        config_confirmed: order.config_confirmed,
        effective_time: order.effective_time,
        expiry_time: order.expiry_time,
        submit_time: order.submit_time,
        sales_code: order.sales_code,
        sales_type: order.sales_type,
        primary_sales_id: order.primary_sales_id,
        secondary_sales_id: order.secondary_sales_id,
        commission_amount: order.commission_amount,
        commission_rate: order.commission_rate,
        link_code: order.link_code,
        screenshot_path: order.screenshot_path,
        screenshot_data: order.screenshot_data,
        created_at: order.created_at,
        updated_at: order.updated_at
      };
      
      // 插入到orders_optimized表
      const { data: insertedData, error: insertError } = await supabase
        .from('orders_optimized')
        .insert(optimizedOrder)
        .select()
        .single();
      
      if (insertError) {
        console.error(`❌ 同步订单 ${order.id} 失败:`, insertError.message);
        failCount++;
      } else {
        console.log(`✅ 成功同步订单 ${order.id}`);
        successCount++;
        
        // 如果订单有销售代码，检查是否需要创建sales_optimized记录
        if (order.sales_code) {
          // 检查是否已存在sales_optimized记录
          const { data: existingSales } = await supabase
            .from('sales_optimized')
            .select('id')
            .eq('order_id', order.id)
            .single();
          
          if (!existingSales) {
            console.log(`  → 为订单 ${order.id} 创建销售记录`);
            // 这里通常会由触发器自动创建，但可以手动检查
          }
        }
      }
    }
    
    console.log();
    console.log('========================================');
    console.log('同步结果');
    console.log('========================================');
    console.log(`✅ 成功同步: ${successCount} 条`);
    console.log(`❌ 同步失败: ${failCount} 条`);
    console.log(`📊 总计处理: ${ordersToSync.length} 条`);
    
    // 3. 验证同步结果
    console.log('\n【步骤3: 验证同步结果】');
    console.log('----------------------------------------');
    
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: optimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
    
    console.log(`orders表总数: ${ordersCount}`);
    console.log(`orders_optimized表总数: ${optimizedCount}`);
    
    if (ordersCount === optimizedCount) {
      console.log('\n✅ 同步完成！两表记录数已一致');
    } else {
      const diff = ordersCount - optimizedCount;
      console.log(`\n⚠️ 仍有 ${diff} 条记录差异，可能需要进一步检查`);
    }
    
    // 4. 检查duration字段规范化
    console.log('\n【步骤4: 规范化duration字段】');
    console.log('----------------------------------------');
    
    // 规范化刚同步的数据的duration字段
    const durationsToFix = [
      { old: '7days', new: '7天' },
      { old: '1month', new: '1个月' },
      { old: '3months', new: '3个月' },
      { old: '6months', new: '6个月' },
      { old: '1year', new: '1年' }
    ];
    
    for (const fix of durationsToFix) {
      const { data: fixedData, error: fixError } = await supabase
        .from('orders_optimized')
        .update({ duration: fix.new })
        .eq('duration', fix.old)
        .select();
      
      if (fixedData && fixedData.length > 0) {
        console.log(`✅ 规范化 ${fixedData.length} 条 "${fix.old}" → "${fix.new}"`);
      }
    }
    
    console.log('\n✅ Duration字段规范化完成');
    
  } catch (error) {
    console.error('同步过程中发生错误:', error);
  }
}

// 运行同步
syncOrdersData();