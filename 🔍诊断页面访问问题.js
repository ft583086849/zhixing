/**
 * 🔍 诊断页面访问问题
 * 在浏览器控制台运行此脚本
 */

async function diagnoseSalesPageAccess() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔍 诊断销售页面访问问题');
  console.log('='.repeat(60));
  
  // 检查当前页面
  const currentUrl = window.location.href;
  console.log('\n📍 当前页面:', currentUrl);
  
  // 检查页面是否正确加载
  console.log('\n📋 步骤1：检查页面元素');
  
  // 检查是否有查询表单
  const searchInput = document.querySelector('input[placeholder*="微信"]');
  const searchButton = document.querySelector('button[type="submit"]');
  
  if (searchInput) {
    console.log('✅ 找到微信号输入框');
  } else {
    console.log('❌ 没有找到微信号输入框');
  }
  
  if (searchButton) {
    console.log('✅ 找到查询按钮');
  } else {
    console.log('❌ 没有找到查询按钮');
  }
  
  // 检查是否有错误信息
  const errorElements = document.querySelectorAll('.ant-alert-error');
  if (errorElements.length > 0) {
    console.log('⚠️ 页面显示错误信息:');
    errorElements.forEach(el => {
      console.log('  -', el.textContent);
    });
  }
  
  // 检查 salesAPI
  console.log('\n📋 步骤2：检查 API 接口');
  if (window.salesAPI) {
    console.log('✅ salesAPI 已加载');
    
    // 检查必要的方法
    const primaryMethod = typeof window.salesAPI.getPrimarySalesSettlement === 'function';
    const secondaryMethod = typeof window.salesAPI.getSecondarySalesSettlement === 'function';
    
    console.log('- getPrimarySalesSettlement:', primaryMethod ? '✅ 存在' : '❌ 不存在');
    console.log('- getSecondarySalesSettlement:', secondaryMethod ? '✅ 存在' : '❌ 不存在');
  } else {
    console.log('❌ salesAPI 未加载');
  }
  
  // 测试一级销售张三
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试1：查询一级销售张三');
  console.log('-'.repeat(40));
  
  if (currentUrl.includes('primary-sales-settlement')) {
    console.log('当前在一级销售结算页面');
    
    if (window.salesAPI && window.salesAPI.getPrimarySalesSettlement) {
      try {
        console.log('尝试查询张三的数据...');
        const response = await window.salesAPI.getPrimarySalesSettlement({
          wechat_name: '张三'
        });
        
        if (response.success) {
          console.log('✅ 查询成功！');
          console.log('销售信息:', response.data.sales);
          console.log('统计数据:', response.data.stats);
        } else {
          console.log('❌ 查询失败:', response.message);
        }
      } catch (error) {
        console.error('❌ 查询出错:', error.message);
      }
    }
    
    // 尝试自动填充并查询
    if (searchInput) {
      console.log('\n尝试自动填充表单...');
      searchInput.value = '张三';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      if (searchButton) {
        console.log('自动点击查询按钮...');
        setTimeout(() => {
          searchButton.click();
        }, 500);
      }
    }
  }
  
  // 测试二级销售王五
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试2：查询二级销售王五');
  console.log('-'.repeat(40));
  
  if (currentUrl.includes('sales-reconciliation')) {
    console.log('当前在二级销售对账页面');
    
    if (window.salesAPI && window.salesAPI.getSecondarySalesSettlement) {
      try {
        console.log('尝试查询王五的数据...');
        const response = await window.salesAPI.getSecondarySalesSettlement({
          wechat_name: '王五'
        });
        
        if (response.success) {
          console.log('✅ 查询成功！');
          console.log('销售信息:', response.data.sales);
          console.log('统计数据:', response.data.stats);
        } else {
          console.log('❌ 查询失败:', response.message);
        }
      } catch (error) {
        console.error('❌ 查询出错:', error.message);
      }
    }
    
    // 尝试自动填充并查询
    if (searchInput) {
      console.log('\n尝试自动填充表单...');
      searchInput.value = '王五';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      if (searchButton) {
        console.log('自动点击查询按钮...');
        setTimeout(() => {
          searchButton.click();
        }, 500);
      }
    }
  }
  
  // 直接查询数据库
  console.log('\n' + '='.repeat(60));
  console.log('📊 步骤3：直接查询数据库');
  console.log('-'.repeat(40));
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  // 查询张三（一级销售）
  try {
    const primaryResponse = await fetch(
      `${supabaseUrl}/rest/v1/primary_sales?wechat_name=eq.张三&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (primaryResponse.ok) {
      const primaryData = await primaryResponse.json();
      if (primaryData.length > 0) {
        console.log('✅ 张三在 primary_sales 表中存在');
        console.log('  - 销售代码:', primaryData[0].sales_code);
        console.log('  - 佣金率:', primaryData[0].commission_rate);
      } else {
        console.log('❌ 张三不在 primary_sales 表中');
      }
    }
  } catch (error) {
    console.error('查询张三失败:', error);
  }
  
  // 查询王五（二级销售）
  try {
    const secondaryResponse = await fetch(
      `${supabaseUrl}/rest/v1/secondary_sales?wechat_name=eq.王五&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (secondaryResponse.ok) {
      const secondaryData = await secondaryResponse.json();
      if (secondaryData.length > 0) {
        console.log('✅ 王五在 secondary_sales 表中存在');
        console.log('  - 销售代码:', secondaryData[0].sales_code);
        console.log('  - 佣金率:', secondaryData[0].commission_rate);
        console.log('  - 所属一级销售ID:', secondaryData[0].primary_sales_id);
      } else {
        console.log('❌ 王五不在 secondary_sales 表中');
      }
    }
  } catch (error) {
    console.error('查询王五失败:', error);
  }
  
  // 诊断总结
  console.log('\n' + '='.repeat(60));
  console.log('💡 诊断总结');
  console.log('='.repeat(60));
  
  console.log('\n问题分析:');
  console.log('1. 页面本身是可以访问的');
  console.log('2. 需要输入微信号或销售代码才能查询数据');
  console.log('3. 页面不是自动加载数据，而是查询式的');
  
  console.log('\n解决方案:');
  console.log('1. 在页面输入框中输入微信号（张三/王五）');
  console.log('2. 点击查询按钮');
  console.log('3. 如果仍然无法查询，检查数据库中是否有这些销售记录');
  
  console.log('\n页面使用说明:');
  console.log('- 一级销售结算页面: https://zhixing-seven.vercel.app/primary-sales-settlement');
  console.log('  输入"张三"查询');
  console.log('- 二级销售对账页面: https://zhixing-seven.vercel.app/sales-reconciliation');
  console.log('  输入"王五"查询');
}

// 执行诊断
diagnoseSalesPageAccess();
