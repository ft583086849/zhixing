// 🔍分析sales_code反向关联方案.js
// 分析通过sales_code反向获取销售微信号的可行性

console.log('=== 🔍 分析sales_code反向关联销售微信号方案 ===\n');

async function analyzeSalesCodeMapping() {
  try {
    if (typeof window === 'undefined' || !window.supabaseClient) {
      console.log('❌ Supabase客户端不可用');
      return;
    }

    console.log('✅ Supabase客户端可用\n');

    // === 1. 检查订单表的sales_code分布 ===
    console.log('📊 === 订单表sales_code分布检查 ===');
    
    const { data: orders } = await window.supabaseClient
      .from('orders')
      .select('sales_code, customer_wechat, sales_wechat_name, sales_name')
      .limit(10);
    
    if (orders && orders.length > 0) {
      console.log(`样本订单数: ${orders.length}`);
      
      // 统计sales_code覆盖率
      const withSalesCode = orders.filter(order => order.sales_code && order.sales_code !== '');
      console.log(`有sales_code的订单: ${withSalesCode.length}/${orders.length}`);
      
      // 显示sales_code样本
      const salesCodes = [...new Set(orders.map(order => order.sales_code).filter(code => code))];
      console.log(`不同的sales_code: ${salesCodes.length} 个`);
      console.log('sales_code样本:', salesCodes.slice(0, 5));
      
      // 检查订单表中的微信号字段
      console.log('\n订单表微信号字段分布:');
      orders.forEach((order, index) => {
        console.log(`订单${index + 1}:`);
        console.log(`  sales_code: ${order.sales_code || '空'}`);
        console.log(`  customer_wechat: ${order.customer_wechat || '空'}`);
        console.log(`  sales_wechat_name: ${order.sales_wechat_name || '空'}`);
        console.log(`  sales_name: ${order.sales_name || '空'}`);
        console.log('---');
      });
    }

    // === 2. 检查销售表的sales_code和微信号 ===
    console.log('\n👥 === 销售表sales_code和微信号检查 ===');
    
    // 检查一级销售表
    const { data: primarySales } = await window.supabaseClient
      .from('primary_sales')
      .select('sales_code, wechat_name, name, phone')
      .limit(5);
    
    if (primarySales && primarySales.length > 0) {
      console.log(`一级销售样本: ${primarySales.length} 个`);
      primarySales.forEach((sale, index) => {
        console.log(`一级销售${index + 1}:`);
        console.log(`  sales_code: ${sale.sales_code || '空'}`);
        console.log(`  wechat_name: ${sale.wechat_name || '空'}`);
        console.log(`  name: ${sale.name || '空'}`);
        console.log(`  phone: ${sale.phone || '空'}`);
        console.log('---');
      });
    } else {
      console.log('❌ 一级销售表无数据');
    }
    
    // 检查二级销售表
    const { data: secondarySales } = await window.supabaseClient
      .from('secondary_sales')
      .select('sales_code, wechat_name, name, phone')
      .limit(5);
    
    if (secondarySales && secondarySales.length > 0) {
      console.log(`\n二级销售样本: ${secondarySales.length} 个`);
      secondarySales.forEach((sale, index) => {
        console.log(`二级销售${index + 1}:`);
        console.log(`  sales_code: ${sale.sales_code || '空'}`);
        console.log(`  wechat_name: ${sale.wechat_name || '空'}`);
        console.log(`  name: ${sale.name || '空'}`);
        console.log(`  phone: ${sale.phone || '空'}`);
        console.log('---');
      });
    } else {
      console.log('❌ 二级销售表无数据');
    }

    // === 3. 验证sales_code反向关联可行性 ===
    console.log('\n🔗 === sales_code反向关联可行性验证 ===');
    
    if (orders && orders.length > 0 && (primarySales?.length > 0 || secondarySales?.length > 0)) {
      // 测试关联
      const allSales = [...(primarySales || []), ...(secondarySales || [])];
      
      console.log('测试关联结果:');
      orders.slice(0, 3).forEach(order => {
        if (order.sales_code) {
          const matchingSale = allSales.find(sale => sale.sales_code === order.sales_code);
          
          console.log(`订单sales_code: ${order.sales_code}`);
          if (matchingSale) {
            console.log(`  ✅ 找到匹配销售: ${matchingSale.wechat_name || matchingSale.name || '无名称'}`);
          } else {
            console.log(`  ❌ 未找到匹配销售`);
          }
        }
      });
    }

    // === 4. 分析当前数据获取的其他问题 ===
    console.log('\n🎯 === 当前数据获取问题分析 ===');
    
    console.log('✅ 确认可行的方案:');
    console.log('1. sales_code反向关联销售微信号');
    console.log('   - 订单表有sales_code');
    console.log('   - 销售表有sales_code + wechat_name');
    console.log('   - 可以通过sales_code精确匹配');
    
    console.log('\n❓ 需要确认的数据获取问题:');
    
    // 检查Redux当前状态
    if (window.store) {
      const state = window.store.getState();
      const adminState = state.admin;
      
      console.log('\nRedux当前数据状态:');
      console.log(`  orders: ${adminState?.orders?.length || 0} 条`);
      console.log(`  sales: ${adminState?.sales?.length || 0} 条`);
      console.log(`  customers: ${adminState?.customers?.length || 0} 条`);
      console.log(`  stats: ${adminState?.stats ? '有' : '无'} 数据`);
      
      // 检查销售数据的微信号情况
      if (adminState?.sales && adminState.sales.length > 0) {
        const noWechatCount = adminState.sales.filter(sale => 
          !sale.wechat_name || sale.wechat_name === '' || sale.wechat_name === '-'
        ).length;
        
        console.log(`\n销售管理数据质量:`);
        console.log(`  无微信号销售: ${noWechatCount}/${adminState.sales.length}`);
        
        if (noWechatCount > 0) {
          console.log('❌ 确认需要修复销售微信号关联');
        } else {
          console.log('✅ 销售微信号显示正常');
        }
      }
    }

    // === 5. 建议的修复方案 ===
    console.log('\n🔧 === 建议的修复方案 ===');
    
    console.log('方案1: 修改AdminAPI.getSales()中的微信号获取逻辑');
    console.log(`
    // 当前逻辑 (有问题):
    return {
      ...sale,  // sale.wechat_name 可能为空
      // 其他字段...
    };
    
    // 新逻辑 (推荐):
    // 通过sales_code从销售表反向获取微信号
    const getSalesWechatBySalesCode = async (salesCode) => {
      // 先查一级销售
      const primary = await supabase
        .from('primary_sales')
        .select('wechat_name, name')
        .eq('sales_code', salesCode)
        .single();
      
      if (primary.data?.wechat_name) {
        return primary.data.wechat_name;
      }
      
      // 再查二级销售
      const secondary = await supabase
        .from('secondary_sales') 
        .select('wechat_name, name')
        .eq('sales_code', salesCode)
        .single();
        
      return secondary.data?.wechat_name || secondary.data?.name || '-';
    };
    `);
    
    console.log('\n方案2: 在订单关联时同步获取销售微信号');
    console.log('- 更高效，一次查询解决所有问题');
    console.log('- 避免重复的数据库查询');
    
    console.log('\n🎯 下一步执行计划:');
    console.log('1. 立即修复AdminAPI.getSales()的微信号获取逻辑');
    console.log('2. 测试验证修复效果');
    console.log('3. 部署并确认销售管理页面显示正常');

  } catch (error) {
    console.error('❌ 分析过程发生错误:', error);
  }
}

// 执行分析
analyzeSalesCodeMapping();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看sales_code关联分析结果');
