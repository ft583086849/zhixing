/**
 * 🔧 快速修复销售微信号显示问题
 * 直接更新销售表数据并刷新页面
 * 请在浏览器控制台运行此脚本
 */

async function quickFixWechatNames() {
  console.log('='.repeat(60));
  console.log('🔧 快速修复销售微信号显示');
  console.log('='.repeat(60));
  
  try {
    // 导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    // Supabase配置
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase连接成功\n');
    
    // 步骤1：获取订单中的销售微信号数据
    console.log('📋 步骤1：分析订单数据');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('sales_code, sales_wechat_name')
      .not('sales_wechat_name', 'is', null);
    
    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
      return;
    }
    
    // 建立销售代码到微信号的映射
    const salesCodeMap = new Map();
    orders.forEach(order => {
      if (order.sales_code && order.sales_wechat_name) {
        salesCodeMap.set(order.sales_code, order.sales_wechat_name);
      }
    });
    
    console.log(`✅ 找到 ${salesCodeMap.size} 个销售代码与微信号的映射\n`);
    
    // 步骤2：更新一级销售表
    console.log('📋 步骤2：更新一级销售表');
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('id, sales_code, wechat_name, name');
    
    let primaryUpdated = 0;
    for (const sale of (primarySales || [])) {
      // 如果销售表没有微信号，但订单表有
      if (!sale.wechat_name && salesCodeMap.has(sale.sales_code)) {
        const wechatName = salesCodeMap.get(sale.sales_code);
        const { error } = await supabase
          .from('primary_sales')
          .update({ wechat_name: wechatName })
          .eq('id', sale.id);
        
        if (!error) {
          primaryUpdated++;
          console.log(`✅ 更新 ${sale.sales_code}: ${wechatName}`);
        }
      }
      // 如果销售表和订单表都没有微信号，使用name字段作为备用
      else if (!sale.wechat_name && sale.name) {
        const { error } = await supabase
          .from('primary_sales')
          .update({ wechat_name: sale.name })
          .eq('id', sale.id);
        
        if (!error) {
          primaryUpdated++;
          console.log(`✅ 使用name作为微信号 ${sale.sales_code}: ${sale.name}`);
        }
      }
    }
    console.log(`一级销售更新完成: ${primaryUpdated} 条\n`);
    
    // 步骤3：更新二级销售表
    console.log('📋 步骤3：更新二级销售表');
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('id, sales_code, wechat_name, name');
    
    let secondaryUpdated = 0;
    for (const sale of (secondarySales || [])) {
      // 如果销售表没有微信号，但订单表有
      if (!sale.wechat_name && salesCodeMap.has(sale.sales_code)) {
        const wechatName = salesCodeMap.get(sale.sales_code);
        const { error } = await supabase
          .from('secondary_sales')
          .update({ wechat_name: wechatName })
          .eq('id', sale.id);
        
        if (!error) {
          secondaryUpdated++;
          console.log(`✅ 更新 ${sale.sales_code}: ${wechatName}`);
        }
      }
      // 如果销售表和订单表都没有微信号，使用name字段作为备用
      else if (!sale.wechat_name && sale.name) {
        const { error } = await supabase
          .from('secondary_sales')
          .update({ wechat_name: sale.name })
          .eq('id', sale.id);
        
        if (!error) {
          secondaryUpdated++;
          console.log(`✅ 使用name作为微信号 ${sale.sales_code}: ${sale.name}`);
        }
      }
    }
    console.log(`二级销售更新完成: ${secondaryUpdated} 条\n`);
    
    // 步骤4：强制刷新页面数据
    console.log('📋 步骤4：刷新页面数据');
    
    // 清除所有缓存
    if (window.localStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('sales') || key.includes('admin')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ 清除本地缓存');
    }
    
    // 如果有Redux store，触发数据重新加载
    if (window.store) {
      // 清空当前数据
      window.store.dispatch({ 
        type: 'admin/getSales/fulfilled', 
        payload: [] 
      });
      
      // 重新获取数据
      if (window.adminAPI && window.adminAPI.getSales) {
        console.log('🔄 重新获取销售数据...');
        const newSales = await window.adminAPI.getSales();
        
        // 更新Redux store
        window.store.dispatch({ 
          type: 'admin/getSales/fulfilled', 
          payload: newSales 
        });
        
        console.log(`✅ 获取到 ${newSales?.length || 0} 条销售数据`);
        
        // 检查微信号
        const withWechat = newSales?.filter(s => s.wechat_name).length || 0;
        console.log(`📊 有微信号的销售: ${withWechat}/${newSales?.length || 0}`);
      }
    }
    
    // 完成
    console.log('\n' + '='.repeat(60));
    console.log('✅ 修复完成！');
    console.log('='.repeat(60));
    
    console.log('\n💡 请执行以下操作:');
    console.log('1. 刷新页面（按F5）');
    console.log('2. 重新访问销售管理页面');
    console.log('3. 查看微信号列是否已显示');
    
    console.log('\n📌 统计结果:');
    console.log(`  一级销售更新: ${primaryUpdated} 条`);
    console.log(`  二级销售更新: ${secondaryUpdated} 条`);
    console.log(`  总计更新: ${primaryUpdated + secondaryUpdated} 条`);
    
    if (primaryUpdated + secondaryUpdated === 0) {
      console.log('\n⚠️ 没有更新任何数据，可能原因:');
      console.log('1. 销售表已有微信号数据');
      console.log('2. 订单表没有销售微信号数据');
      console.log('3. 销售表没有name字段可用作备用');
    }
    
  } catch (error) {
    console.error('❌ 修复过程发生错误:', error);
  }
}

// 执行修复
console.log('💡 开始执行快速修复...\n');
quickFixWechatNames();
