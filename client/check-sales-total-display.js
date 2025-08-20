#!/usr/bin/env node

/**
 * 检查销售管理页面的总销售额显示
 */

console.log('🔍 检查销售管理页面总销售额显示\n');

console.log('请在销售管理页面的浏览器控制台执行以下代码：\n');

const checkCode = `
// 检查销售管理页面数据
(async function() {
  console.log('🔍 检查销售管理页面数据...');
  
  try {
    // 1. 获取销售数据
    console.log('\\n1️⃣ 获取销售数据:');
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    
    const salesData = await AdminAPI.getSales();
    
    if (salesData && salesData.length > 0) {
      console.log(\`找到 \${salesData.length} 个销售记录\`);
      
      // 2. 计算总销售额
      console.log('\\n2️⃣ 计算总销售额:');
      
      // 方法1: 从sales_optimized表的total_amount字段
      const totalFromSales = salesData.reduce((sum, sale) => 
        sum + (parseFloat(sale.total_amount) || 0), 0
      );
      console.log(\`从销售表计算: $\${totalFromSales.toFixed(2)}\`);
      
      // 方法2: 从sales_optimized表的confirmed_amount字段
      const totalConfirmed = salesData.reduce((sum, sale) => 
        sum + (parseFloat(sale.confirmed_amount) || 0), 0
      );
      console.log(\`已确认金额: $\${totalConfirmed.toFixed(2)}\`);
      
      // 3. 获取订单数据验证
      console.log('\\n3️⃣ 从订单数据验证:');
      const orders = await AdminAPI.getOrders();
      
      if (orders && orders.length > 0) {
        // 计算所有订单总金额
        const orderTotal = orders.reduce((sum, order) => {
          if (order.status !== 'rejected') {
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
            return sum + amountUSD;
          }
          return sum;
        }, 0);
        console.log(\`从订单表计算: $\${orderTotal.toFixed(2)}\`);
        
        // 只计算已确认的订单
        const confirmedOrderTotal = orders.reduce((sum, order) => {
          if (['confirmed', 'confirmed_config', 'active'].includes(order.status)) {
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
            return sum + amountUSD;
          }
          return sum;
        }, 0);
        console.log(\`已确认订单金额: $\${confirmedOrderTotal.toFixed(2)}\`);
      }
      
      // 4. 检查排除功能影响
      console.log('\\n4️⃣ 检查排除功能影响:');
      const ExcludedSalesService = (await import('/src/services/excludedSalesService.js')).default;
      const excludedCodes = await ExcludedSalesService.getExcludedSalesCodes();
      
      if (excludedCodes.length > 0) {
        console.log(\`当前排除了 \${excludedCodes.length} 个销售\`);
        
        // 计算排除的金额
        const excludedAmount = salesData
          .filter(sale => excludedCodes.includes(sale.sales_code))
          .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        
        console.log(\`排除的金额: $\${excludedAmount.toFixed(2)}\`);
        console.log(\`排除后的总额: $\${(totalFromSales - excludedAmount).toFixed(2)}\`);
      } else {
        console.log('没有排除的销售');
      }
      
      // 5. 显示详细的销售数据
      console.log('\\n5️⃣ Top 5 销售详情:');
      const top5 = [...salesData]
        .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
        .slice(0, 5);
      
      top5.forEach((sale, index) => {
        console.log(\`\${index + 1}. \${sale.wechat_name}:\`);
        console.log(\`   总金额: $\${sale.total_amount || 0}\`);
        console.log(\`   已确认金额: $\${sale.confirmed_amount || 0}\`);
        console.log(\`   订单数: \${sale.total_orders || 0}\`);
      });
      
      // 6. 结论
      console.log('\\n📊 结论:');
      console.log(\`显示的总销售额 $10,320.00 可能是:\`);
      console.log(\`1. 所有销售的total_amount总和: $\${totalFromSales.toFixed(2)}\`);
      console.log(\`2. 已确认订单金额总和: $\${totalConfirmed.toFixed(2)}\`);
      console.log(\`3. 应用排除后的金额\`);
      console.log('\\n如果数字不匹配，可能是:');
      console.log('• 缓存数据未更新');
      console.log('• 排除功能影响');
      console.log('• 统计口径不一致');
      
    } else {
      console.log('❌ 没有找到销售数据');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
})();
`;

console.log(checkCode);

console.log('\n📋 注意事项：');
console.log('1. 销售管理页面本身没有显示总销售额的统计卡片');
console.log('2. 用户看到的10,320可能来自其他页面或其他地方');
console.log('3. 需要确认具体在哪里看到这个数字');