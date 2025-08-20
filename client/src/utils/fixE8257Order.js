/**
 * 修复e8257订单数据
 */

export async function fixE8257Order() {
  console.log('🔍 修复e8257订单数据...\n');
  
  // 获取supabase客户端
  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('Supabase客户端未找到');
    return;
  }
  
  try {
    // 1. 查询当前数据
    console.log('1️⃣ 查询当前数据:');
    const { data: currentData, error: selectError } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        order_number,
        tradingview_username,
        duration,
        amount,
        alipay_amount,
        effective_time,
        expiry_time,
        created_at,
        updated_at
      `)
      .eq('id', 3)
      .eq('tradingview_username', 'e8257')
      .single();
    
    if (selectError) {
      console.error('查询失败:', selectError);
      return;
    }
    
    if (!currentData) {
      console.log('未找到订单ID=3的e8257订单');
      return;
    }
    
    console.log('当前数据:');
    console.log('-----------------------------------');
    console.log(`订单ID: ${currentData.id}`);
    console.log(`订单号: ${currentData.order_number}`);
    console.log(`用户名: ${currentData.tradingview_username}`);
    console.log(`购买时长: ${currentData.duration}`);
    console.log(`订单金额: $${currentData.amount}`);
    console.log(`支付宝金额: ¥${currentData.alipay_amount}`);
    console.log(`生效时间: ${currentData.effective_time}`);
    console.log(`到期时间: ${currentData.expiry_time}`);
    console.log('-----------------------------------\n');
    
    // 确认是否继续
    if (currentData.duration === '1year' && currentData.amount === 1588) {
      console.log('✅ 数据已经是正确的，无需修复');
      return;
    }
    
    // 2. 计算新的到期时间
    let newExpiryTime = currentData.expiry_time;
    if (currentData.effective_time) {
      const effectiveDate = new Date(currentData.effective_time);
      const expiryDate = new Date(effectiveDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 加1年
      newExpiryTime = expiryDate.toISOString();
      console.log(`📅 计算新的到期时间: ${newExpiryTime}`);
    }
    
    // 3. 更新订单
    console.log('\n2️⃣ 更新订单数据:');
    const updateData = {
      duration: '1year',
      amount: 1588,
      expiry_time: newExpiryTime,
      updated_at: new Date().toISOString()
    };
    
    console.log('更新内容:', updateData);
    
    const { data: updatedData, error: updateError } = await supabase
      .from('orders_optimized')
      .update(updateData)
      .eq('id', 3)
      .eq('tradingview_username', 'e8257')
      .select();
    
    if (updateError) {
      console.error('更新失败:', updateError);
      return;
    }
    
    // 4. 查询更新后的结果
    console.log('\n3️⃣ 查询更新后的结果:');
    const { data: newData, error: newSelectError } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        order_number,
        tradingview_username,
        duration,
        amount,
        alipay_amount,
        effective_time,
        expiry_time,
        created_at,
        updated_at
      `)
      .eq('id', 3)
      .eq('tradingview_username', 'e8257')
      .single();
    
    if (newSelectError) {
      console.error('查询更新后数据失败:', newSelectError);
      return;
    }
    
    console.log('更新后数据:');
    console.log('-----------------------------------');
    console.log(`订单ID: ${newData.id}`);
    console.log(`订单号: ${newData.order_number}`);
    console.log(`用户名: ${newData.tradingview_username}`);
    console.log(`购买时长: ${newData.duration} ✅`);
    console.log(`订单金额: $${newData.amount} ✅`);
    console.log(`支付宝金额: ¥${newData.alipay_amount}`);
    console.log(`生效时间: ${newData.effective_time}`);
    console.log(`到期时间: ${newData.expiry_time} ✅`);
    console.log('-----------------------------------');
    
    console.log('\n✅ 修复完成！');
    console.log('主要变更:');
    console.log(`  - duration: ${currentData.duration} → ${newData.duration}`);
    console.log(`  - amount: $${currentData.amount} → $${newData.amount}`);
    console.log(`  - expiry_time: ${currentData.expiry_time} → ${newData.expiry_time}`);
    
    // 刷新页面数据
    console.log('\n正在刷新页面数据...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

// 暴露到window对象
if (typeof window !== 'undefined') {
  window.fixE8257Order = fixE8257Order;
}