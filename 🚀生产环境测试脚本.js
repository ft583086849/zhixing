// 🚀 生产环境测试脚本
// 在 https://zhixing-seven.vercel.app/primary-sales-settlement 页面的控制台运行

console.log('🚀 开始测试一级销售查询功能（生产环境版）...');
console.log('='.repeat(50));

// 测试函数
async function testPrimarySalesQueryProd() {
  console.log('📝 测试查询微信号: 870501');
  
  try {
    // 1. 检查页面是否正确加载
    console.log('\n1️⃣ 检查页面环境...');
    
    // 检查React组件
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactRootContainer) {
      console.log('✅ React应用已加载');
    } else {
      console.log('⚠️ React应用可能未正确加载');
    }
    
    // 检查Redux store
    if (window.store) {
      console.log('✅ Redux store已初始化');
      const state = window.store.getState();
      console.log('📊 当前state结构:', Object.keys(state));
      
      if (state.sales) {
        console.log('📋 sales状态:', {
          loading: state.sales.loading,
          error: state.sales.error,
          primarySalesSettlement: state.sales.primarySalesSettlement
        });
      }
    } else {
      console.log('❌ Redux store未找到');
    }
    
    // 2. 手动触发查询
    console.log('\n2️⃣ 尝试手动触发查询...');
    
    // 查找查询表单
    const wechatInput = document.querySelector('input[placeholder*="微信号"]');
    const queryButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('查询')
    );
    
    if (wechatInput && queryButton) {
      console.log('✅ 找到查询表单');
      console.log('  - 当前输入值:', wechatInput.value);
      
      // 设置输入值
      wechatInput.value = '870501';
      wechatInput.dispatchEvent(new Event('input', { bubbles: true }));
      wechatInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('💡 已设置微信号为 870501，请手动点击查询按钮');
      console.log('或者在控制台执行: queryButton.click()');
      
      // 将按钮暴露给全局
      window.queryButton = queryButton;
    } else {
      console.log('❌ 未找到查询表单元素');
      console.log('  - 微信号输入框:', !!wechatInput);
      console.log('  - 查询按钮:', !!queryButton);
    }
    
    // 3. 直接调用API测试
    console.log('\n3️⃣ 直接测试API调用...');
    
    // 使用fetch直接调用后端API
    const testDirectAPI = async () => {
      try {
        // 获取当前的认证token
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          console.log('⚠️ 未找到认证token，可能需要先登录');
          return;
        }
        
        console.log('📡 发送API请求...');
        
        // 构造请求URL - 注意这里需要使用正确的API端点
        const apiUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co/rest/v1/rpc/get_primary_sales_settlement';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            wechat_name: '870501'
          })
        });
        
        const data = await response.json();
        console.log('📊 API响应:', data);
        
      } catch (error) {
        console.error('❌ API调用失败:', error);
      }
    };
    
    // 4. 使用Supabase客户端直接查询
    console.log('\n4️⃣ 使用Supabase客户端查询...');
    
    if (window.supabase || window.supabaseClient) {
      const supabase = window.supabase || window.supabaseClient;
      
      // 查询一级销售
      const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .eq('wechat_name', '870501')
        .single();
      
      if (primaryError) {
        console.error('❌ 查询一级销售失败:', primaryError);
      } else {
        console.log('✅ 找到一级销售:', primarySales);
        
        // 查询相关订单
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('sales_code', primarySales.sales_code);
        
        if (ordersError) {
          console.error('❌ 查询订单失败:', ordersError);
        } else {
          console.log('📋 相关订单数量:', orders?.length || 0);
          
          // 计算统计
          const confirmedOrders = orders?.filter(o => o.config_confirmed === true) || [];
          const totalCommission = confirmedOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
          
          console.log('💰 统计数据:');
          console.log('  - 确认订单数:', confirmedOrders.length);
          console.log('  - 总佣金:', totalCommission);
        }
        
        // 查询二级销售
        const { data: secondarySales, error: secondaryError } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('primary_sales_id', primarySales.id);
        
        if (secondaryError) {
          console.error('❌ 查询二级销售失败:', secondaryError);
        } else {
          console.log('👥 二级销售数量:', secondarySales?.length || 0);
        }
      }
    } else {
      console.log('❌ Supabase客户端未找到');
    }
    
    // 5. 检查网络请求
    console.log('\n5️⃣ 监听网络请求...');
    console.log('💡 请手动点击查询按钮，然后查看Network标签页中的请求');
    
    // 提供API测试函数
    window.testDirectAPI = testDirectAPI;
    console.log('💡 可以执行 testDirectAPI() 来测试直接API调用');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testPrimarySalesQueryProd().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('✅ 测试脚本执行完成！');
  console.log('📝 建议操作:');
  console.log('1. 手动点击查询按钮或执行: queryButton.click()');
  console.log('2. 查看Network标签页中的请求');
  console.log('3. 执行 testDirectAPI() 测试直接API调用');
});

// 导出供外部使用
window.testPrimarySalesQueryProd = testPrimarySalesQueryProd;
