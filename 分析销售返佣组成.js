const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://tjypwvqgadmfcybrnkkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeXB3dnFnYWRtZmN5YnJua2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxNTcxNDEsImV4cCI6MjAzOTczMzE0MX0.XpKDVW0zzCFb9FKRSS3buiHH7uPfJAJvQ8Zq_fAKRfo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCommissions() {
  console.log('\n===== 销售返佣金额分析报告 =====\n');
  
  try {
    // 1. 获取所有已配置确认的订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'confirmed_config')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('获取订单失败:', ordersError);
      return;
    }
    
    // 2. 获取所有销售人员信息
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('*');
    
    // 创建销售人员映射
    const salesMap = new Map();
    primarySales?.forEach(s => salesMap.set(s.id, { ...s, type: 'primary' }));
    secondarySales?.forEach(s => salesMap.set(s.id, { ...s, type: 'secondary' }));
    
    // 3. 分析每个订单的返佣
    let totalCommission = 0;
    const commissionDetails = [];
    
    for (const order of orders) {
      // 确定销售人员
      let salesPerson = null;
      let salesType = '';
      let commissionRate = 0;
      let primarySalesInfo = null;
      
      if (order.sales_code) {
        // 通过sales_code查找销售
        const primaryMatch = primarySales?.find(s => s.sales_code === order.sales_code);
        const secondaryMatch = secondarySales?.find(s => s.sales_code === order.sales_code);
        
        if (secondaryMatch) {
          salesPerson = secondaryMatch;
          salesType = 'secondary';
          // 获取上级销售
          if (secondaryMatch.primary_sales_id) {
            primarySalesInfo = salesMap.get(secondaryMatch.primary_sales_id);
          }
          // 二级销售佣金率
          commissionRate = secondaryMatch.commission_rate || 25;
        } else if (primaryMatch) {
          salesPerson = primaryMatch;
          salesType = 'primary';
          commissionRate = 40; // 一级销售基础佣金率
        }
      }
      
      if (!salesPerson) {
        // 尝试通过其他字段查找
        if (order.secondary_sales_id) {
          salesPerson = salesMap.get(order.secondary_sales_id);
          salesType = 'secondary';
          const secondaryInfo = secondarySales?.find(s => s.id === order.secondary_sales_id);
          if (secondaryInfo?.primary_sales_id) {
            primarySalesInfo = salesMap.get(secondaryInfo.primary_sales_id);
          }
          commissionRate = salesPerson?.commission_rate || 25;
        } else if (order.primary_sales_id) {
          salesPerson = salesMap.get(order.primary_sales_id);
          salesType = 'primary';
          commissionRate = 40;
        }
      }
      
      // 计算佣金
      const orderAmount = parseFloat(order.amount) || 0;
      let salesCommission = 0;
      let primaryCommission = 0;
      
      if (salesType === 'secondary' && primarySalesInfo) {
        // 二级销售的佣金
        salesCommission = orderAmount * (commissionRate / 100);
        // 一级销售的佣金（40% - 二级销售佣金率）
        primaryCommission = orderAmount * ((40 - commissionRate) / 100);
      } else if (salesType === 'primary') {
        // 一级销售直接销售
        salesCommission = orderAmount * 0.4;
      } else {
        // 独立销售
        salesCommission = orderAmount * (commissionRate / 100);
      }
      
      const totalOrderCommission = salesCommission + primaryCommission;
      totalCommission += totalOrderCommission;
      
      commissionDetails.push({
        订单ID: order.id,
        买家微信: order.user_wechat || '-',
        TradingView: order.tradingview_username || '-',
        订单金额: `$${orderAmount.toFixed(2)}`,
        销售微信: salesPerson?.wechat_name || '-',
        销售类型: salesType === 'primary' ? '一级销售' : 
                 salesType === 'secondary' ? '二级销售' : '独立销售',
        一级销售: primarySalesInfo?.wechat_name || (salesType === 'primary' ? salesPerson?.wechat_name : '-'),
        销售佣金: `$${salesCommission.toFixed(2)} (${commissionRate}%)`,
        一级佣金: primaryCommission > 0 ? `$${primaryCommission.toFixed(2)} (${(40-commissionRate)}%)` : '-',
        总佣金: `$${totalOrderCommission.toFixed(2)}`,
        下单时间: new Date(order.created_at).toLocaleString('zh-CN')
      });
    }
    
    // 4. 输出详细报告
    console.log(`总返佣金额: $${totalCommission.toFixed(2)}\n`);
    console.log('详细订单佣金明细:');
    console.log('='.repeat(150));
    
    // 按佣金金额排序
    commissionDetails.sort((a, b) => {
      const aAmount = parseFloat(a.总佣金.replace('$', ''));
      const bAmount = parseFloat(b.总佣金.replace('$', ''));
      return bAmount - aAmount;
    });
    
    commissionDetails.forEach((detail, index) => {
      console.log(`\n【订单 ${index + 1}】`);
      console.log(`订单ID: ${detail.订单ID}`);
      console.log(`买家微信: ${detail.买家微信}`);
      console.log(`TradingView: ${detail.TradingView}`);
      console.log(`订单金额: ${detail.订单金额}`);
      console.log(`销售微信: ${detail.销售微信} (${detail.销售类型})`);
      if (detail.一级销售 !== '-' && detail.销售类型 === '二级销售') {
        console.log(`一级销售: ${detail.一级销售}`);
      }
      console.log(`销售佣金: ${detail.销售佣金}`);
      if (detail.一级佣金 !== '-') {
        console.log(`一级获得: ${detail.一级佣金}`);
      }
      console.log(`订单总佣金: ${detail.总佣金}`);
      console.log(`下单时间: ${detail.下单时间}`);
    });
    
    // 5. 汇总统计
    console.log('\n' + '='.repeat(150));
    console.log('\n📊 汇总统计:');
    
    // 按销售人员汇总
    const salesSummary = new Map();
    
    for (const order of orders) {
      // 处理销售人员佣金
      let salesPerson = null;
      let salesType = '';
      let commissionRate = 0;
      let primarySalesInfo = null;
      
      if (order.sales_code) {
        const primaryMatch = primarySales?.find(s => s.sales_code === order.sales_code);
        const secondaryMatch = secondarySales?.find(s => s.sales_code === order.sales_code);
        
        if (secondaryMatch) {
          salesPerson = secondaryMatch;
          salesType = 'secondary';
          if (secondaryMatch.primary_sales_id) {
            primarySalesInfo = salesMap.get(secondaryMatch.primary_sales_id);
          }
          commissionRate = secondaryMatch.commission_rate || 25;
        } else if (primaryMatch) {
          salesPerson = primaryMatch;
          salesType = 'primary';
          commissionRate = 40;
        }
      }
      
      const orderAmount = parseFloat(order.amount) || 0;
      
      if (salesPerson) {
        const key = salesPerson.wechat_name;
        if (!salesSummary.has(key)) {
          salesSummary.set(key, {
            销售微信: key,
            销售类型: salesType === 'primary' ? '一级销售' : 
                     salesType === 'secondary' ? '二级销售' : '独立销售',
            订单数: 0,
            订单总额: 0,
            应返佣金: 0
          });
        }
        
        const summary = salesSummary.get(key);
        summary.订单数++;
        summary.订单总额 += orderAmount;
        
        // 计算佣金
        if (salesType === 'secondary') {
          summary.应返佣金 += orderAmount * (commissionRate / 100);
        } else if (salesType === 'primary') {
          // 一级销售的佣金包括直接销售和间接销售
          summary.应返佣金 += orderAmount * 0.4;
        } else {
          summary.应返佣金 += orderAmount * (commissionRate / 100);
        }
        
        // 如果是二级销售，也要给一级销售加上间接佣金
        if (salesType === 'secondary' && primarySalesInfo) {
          const primaryKey = primarySalesInfo.wechat_name;
          if (!salesSummary.has(primaryKey)) {
            salesSummary.set(primaryKey, {
              销售微信: primaryKey,
              销售类型: '一级销售',
              订单数: 0,
              订单总额: 0,
              应返佣金: 0
            });
          }
          const primarySummary = salesSummary.get(primaryKey);
          primarySummary.应返佣金 += orderAmount * ((40 - commissionRate) / 100);
        }
      }
    }
    
    console.log('\n按销售人员汇总:');
    const summaryArray = Array.from(salesSummary.values()).sort((a, b) => b.应返佣金 - a.应返佣金);
    
    summaryArray.forEach(summary => {
      console.log(`\n${summary.销售微信} (${summary.销售类型}):`);
      console.log(`  订单数: ${summary.订单数}`);
      console.log(`  订单总额: $${summary.订单总额.toFixed(2)}`);
      console.log(`  应返佣金: $${summary.应返佣金.toFixed(2)}`);
    });
    
    console.log('\n' + '='.repeat(150));
    console.log(`\n💰 总返佣金额: $${totalCommission.toFixed(2)}`);
    console.log(`📝 总订单数: ${orders.length}`);
    console.log(`💵 总订单金额: $${orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0).toFixed(2)}`);
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

// 执行分析
analyzeCommissions();
