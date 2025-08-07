// 🔍检查SupabaseService和Redux问题
// 专门检查Supabase初始化和Redux更新问题

console.log('=== 🔍 检查SupabaseService和Redux问题 ===\n');

async function checkSupabaseAndRedux() {
  try {
    // === 1. 检查SupabaseService.supabase是否正确初始化 ===
    console.log('🔗 === 检查SupabaseService.supabase初始化 ===');
    
    // 检查window.supabaseClient (通常用于前端)
    if (window.supabaseClient) {
      console.log('✅ window.supabaseClient 存在');
      
      // 测试直接查询
      try {
        const { data, error } = await window.supabaseClient.from('orders').select('amount').limit(1);
        if (error) {
          console.log('❌ window.supabaseClient查询失败:', error.message);
        } else {
          console.log('✅ window.supabaseClient查询成功:', data);
        }
      } catch (err) {
        console.log('❌ window.supabaseClient查询异常:', err.message);
      }
    } else {
      console.log('❌ window.supabaseClient 不存在');
    }
    
    // 检查SupabaseService中的supabase
    if (window.SupabaseService && window.SupabaseService.supabase) {
      console.log('✅ SupabaseService.supabase 存在');
      
      try {
        const { data, error } = await window.SupabaseService.supabase.from('orders').select('amount').limit(1);
        if (error) {
          console.log('❌ SupabaseService.supabase查询失败:', error.message);
        } else {
          console.log('✅ SupabaseService.supabase查询成功:', data);
        }
      } catch (err) {
        console.log('❌ SupabaseService.supabase查询异常:', err.message);
      }
    } else {
      console.log('❌ SupabaseService.supabase 不存在');
      console.log('💡 这可能是数据概览为0的根本原因!');
    }

    // === 2. 手动测试数据概览逻辑 ===
    console.log('\n💰 === 手动测试数据概览逻辑 ===');
    
    // 使用可用的supabase客户端
    const supabaseClient = window.SupabaseService?.supabase || window.supabaseClient;
    
    if (supabaseClient) {
      console.log('🔄 手动执行数据概览计算逻辑...');
      
      const { data: orders, error } = await supabaseClient.from('orders').select('*');
      
      if (error) {
        console.log('❌ 订单查询失败:', error.message);
        console.log('💡 这就是数据概览为0的原因!');
      } else if (!orders || orders.length === 0) {
        console.log('❌ 订单查询成功但无数据');
      } else {
        console.log(`✅ 订单查询成功: ${orders.length} 条`);
        
        let total_amount = 0;
        orders.forEach(order => {
          let amount = parseFloat(order.amount || 0);
          if (order.actual_payment_amount && parseFloat(order.actual_payment_amount) > 0) {
            amount = parseFloat(order.actual_payment_amount);
          }
          
          if (order.payment_method === 'alipay') {
            total_amount += (amount / 7.15);
          } else {
            total_amount += amount;
          }
        });
        
        console.log(`手动计算总金额: $${total_amount.toFixed(2)}`);
        
        if (total_amount > 0) {
          console.log('✅ 手动计算有金额，Supabase查询正常');
          console.log('💡 问题可能在API调用或Redux更新');
        } else {
          console.log('❌ 手动计算也为0');
          console.log('💡 检查amount字段数据或计算逻辑');
        }
      }
    } else {
      console.log('❌ 没有可用的Supabase客户端');
    }

    // === 3. 检查Redux更新问题 ===
    console.log('\n🔄 === 检查Redux更新问题 ===');
    
    if (window.store) {
      const state = window.store.getState();
      console.log('当前Redux状态:', {
        loading: state.admin?.loading,
        hasStats: !!state.admin?.stats,
        statsContent: state.admin?.stats
      });
      
      // 检查Redux actions是否可用
      if (window.store.dispatch) {
        console.log('✅ Redux dispatch 可用');
        
        // 尝试直接调用API并查看结果
        if (window.adminAPI && window.adminAPI.getStats) {
          console.log('🔄 直接调用adminAPI.getStats()...');
          
          try {
            const apiResult = await window.adminAPI.getStats();
            console.log('API调用结果:', apiResult);
            
            // 检查API结果和Redux状态是否一致
            const currentReduxStats = window.store.getState().admin?.stats;
            console.log('Redux中的stats:', currentReduxStats);
            
            if (apiResult && apiResult.total_amount > 0 && currentReduxStats?.total_amount === 0) {
              console.log('🚨 发现问题: API返回正确数据但Redux未更新!');
              console.log('💡 这是Redux更新问题');
            } else if (!apiResult || apiResult.total_amount === 0) {
              console.log('🚨 发现问题: API本身返回0或失败');
              console.log('💡 这是API逻辑问题');
            } else {
              console.log('✅ API和Redux数据一致');
            }
          } catch (apiError) {
            console.log('❌ API调用失败:', apiError.message);
            console.log('完整错误:', apiError);
          }
        }
      } else {
        console.log('❌ Redux dispatch 不可用');
      }
    } else {
      console.log('❌ Redux store 不可用');
    }

    // === 4. 检查销售微信号字段问题 ===
    console.log('\n👥 === 检查销售微信号字段问题 ===');
    
    console.log('🔍 用户指出的正确逻辑:');
    console.log('1. 从订单表取 sales_code');
    console.log('2. 用 sales_code 去销售表查找');
    console.log('3. 销售表的微信号字段是 name (不是wechat_name)');
    
    // 测试正确的关联逻辑
    if (supabaseClient) {
      console.log('\n🧪 测试正确的销售微信号关联逻辑:');
      
      const { data: sampleOrders } = await supabaseClient.from('orders').select('sales_code').limit(3);
      const { data: primarySales } = await supabaseClient.from('primary_sales').select('sales_code, name, wechat_name');
      
      if (sampleOrders && primarySales) {
        sampleOrders.forEach(order => {
          if (order.sales_code) {
            const matchingSale = primarySales.find(sale => sale.sales_code === order.sales_code);
            
            console.log(`订单sales_code: ${order.sales_code}`);
            if (matchingSale) {
              console.log(`  找到销售: name=${matchingSale.name || '空'}, wechat_name=${matchingSale.wechat_name || '空'}`);
              console.log(`  正确的微信号应该取: ${matchingSale.name || matchingSale.wechat_name || '空'}`);
            } else {
              console.log(`  未找到匹配销售`);
            }
          }
        });
      }
    }

    // === 5. 提供具体修复方案 ===
    console.log('\n🔧 === 具体修复方案 ===');
    
    console.log('需要修复的代码问题:');
    console.log('1. 修复SupabaseService.supabase初始化问题');
    console.log('2. 修复销售微信号字段名: order.sales_wechat_name → 通过sales_code查找sale.name');
    console.log('3. 检查Redux数据更新逻辑');
    console.log('4. 确保API调用使用正确的supabase客户端');

  } catch (error) {
    console.error('❌ 检查过程发生错误:', error);
  }
}

// 执行检查
checkSupabaseAndRedux();

console.log('\n💻 请运行此脚本并告诉我结果，我将提供精准修复!');
