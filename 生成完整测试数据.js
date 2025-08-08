// 在浏览器控制台运行此脚本，生成完整的测试数据
// 包括销售、订单、客户等，用于验证时间筛选和Top5排行榜

(async function() {
    console.log('🚀 开始生成完整测试数据...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 获取当前时间
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // 步骤1: 创建测试销售人员
    console.log('📋 步骤1: 创建测试销售人员...');
    
    const testPrimarySales = [
        {
            wechat_name: '测试销售张三',
            name: '张三',
            sales_code: 'PRI_ZHANG3_' + Date.now(),
            commission_rate: 0.4,
            created_at: monthAgo.toISOString()
        },
        {
            wechat_name: '测试销售李四',
            name: '李四',
            sales_code: 'PRI_LI4_' + Date.now(),
            commission_rate: 0.35,
            created_at: twoMonthsAgo.toISOString()
        },
        {
            wechat_name: '测试销售王五',
            name: '王五',
            sales_code: 'PRI_WANG5_' + Date.now(),
            commission_rate: 0.38,
            created_at: twoMonthsAgo.toISOString()
        }
    ];
    
    const createdPrimarySales = [];
    for (const sale of testPrimarySales) {
        const { data, error } = await supabase
            .from('primary_sales')
            .insert(sale)
            .select()
            .single();
        
        if (!error) {
            console.log(`✅ 创建一级销售: ${sale.wechat_name}`);
            createdPrimarySales.push(data);
        } else {
            console.error(`❌ 创建失败: ${sale.wechat_name}`, error);
        }
    }
    
    // 步骤2: 创建二级销售（部分有上级，部分独立）
    console.log('\n📋 步骤2: 创建二级销售...');
    
    const testSecondarySales = [
        {
            wechat_name: '测试二级赵六',
            name: '赵六',
            sales_code: 'SEC_ZHAO6_' + Date.now(),
            commission_rate: 0.25,
            primary_sales_id: createdPrimarySales[0]?.id, // 属于张三
            created_at: weekAgo.toISOString()
        },
        {
            wechat_name: '测试二级钱七',
            name: '钱七',
            sales_code: 'SEC_QIAN7_' + Date.now(),
            commission_rate: 0.25,
            primary_sales_id: createdPrimarySales[0]?.id, // 属于张三
            created_at: twoWeeksAgo.toISOString()
        },
        {
            wechat_name: '测试独立孙八',
            name: '孙八',
            sales_code: 'SEC_SUN8_' + Date.now(),
            commission_rate: 0.3,
            primary_sales_id: null, // 独立销售
            created_at: monthAgo.toISOString()
        },
        {
            wechat_name: '测试二级周九',
            name: '周九',
            sales_code: 'SEC_ZHOU9_' + Date.now(),
            commission_rate: 0.25,
            primary_sales_id: createdPrimarySales[1]?.id, // 属于李四
            created_at: monthAgo.toISOString()
        }
    ];
    
    const createdSecondarySales = [];
    for (const sale of testSecondarySales) {
        const { data, error } = await supabase
            .from('secondary_sales')
            .insert(sale)
            .select()
            .single();
        
        if (!error) {
            console.log(`✅ 创建二级销售: ${sale.wechat_name}`);
            createdSecondarySales.push(data);
        } else {
            console.error(`❌ 创建失败: ${sale.wechat_name}`, error);
        }
    }
    
    // 合并所有销售代码
    const allSalesCodes = [
        ...createdPrimarySales.map(s => s.sales_code),
        ...createdSecondarySales.map(s => s.sales_code)
    ];
    
    // 步骤3: 创建不同时间段的订单
    console.log('\n📋 步骤3: 创建不同时间段的订单...');
    
    const testOrders = [
        // 今天的订单 - 5笔
        {
            customer_wechat: '今日客户1',
            sales_code: allSalesCodes[0], // 张三
            amount: 299,
            actual_payment_amount: 299,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 今天上午
            payment_time: new Date(today.getTime() + 3 * 60 * 60 * 1000).toISOString(),
            updated_at: now.toISOString()
        },
        {
            customer_wechat: '今日客户2',
            sales_code: allSalesCodes[1], // 李四
            amount: 599,
            actual_payment_amount: 599,
            duration: '6months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(today.getTime() + 5 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(today.getTime() + 6 * 60 * 60 * 1000).toISOString(),
            updated_at: now.toISOString()
        },
        {
            customer_wechat: '今日客户3',
            sales_code: allSalesCodes[2], // 王五
            amount: 999,
            actual_payment_amount: 999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
            updated_at: now.toISOString()
        },
        {
            customer_wechat: '今日客户4',
            sales_code: allSalesCodes[3], // 赵六
            amount: 199,
            actual_payment_amount: 199,
            duration: '1month',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(),
            updated_at: now.toISOString()
        },
        {
            customer_wechat: '今日客户5',
            sales_code: allSalesCodes[4], // 钱七
            amount: 99,
            actual_payment_amount: 99,
            duration: '1month',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(today.getTime() + 12 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(today.getTime() + 13 * 60 * 60 * 1000).toISOString(),
            updated_at: now.toISOString()
        },
        
        // 昨天的订单 - 3笔
        {
            customer_wechat: '昨日客户1',
            sales_code: allSalesCodes[0], // 张三
            amount: 399,
            actual_payment_amount: 399,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yesterday.getTime() + 11 * 60 * 60 * 1000).toISOString(),
            updated_at: yesterday.toISOString()
        },
        {
            customer_wechat: '昨日客户2',
            sales_code: allSalesCodes[5], // 孙八
            amount: 799,
            actual_payment_amount: 799,
            duration: '6months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yesterday.getTime() + 15 * 60 * 60 * 1000).toISOString(),
            updated_at: yesterday.toISOString()
        },
        {
            customer_wechat: '昨日客户3',
            sales_code: allSalesCodes[1], // 李四
            amount: 299,
            actual_payment_amount: 299,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yesterday.getTime() + 17 * 60 * 60 * 1000).toISOString(),
            updated_at: yesterday.toISOString()
        },
        
        // 本周的订单（3-6天前）- 4笔
        {
            customer_wechat: '本周客户1',
            sales_code: allSalesCodes[2], // 王五
            amount: 1299,
            actual_payment_amount: 1299,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(weekAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(weekAgo.getTime() + 25 * 60 * 60 * 1000).toISOString(),
            updated_at: weekAgo.toISOString()
        },
        {
            customer_wechat: '本周客户2',
            sales_code: allSalesCodes[0], // 张三
            amount: 599,
            actual_payment_amount: 599,
            duration: '6months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(weekAgo.getTime() + 48 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(weekAgo.getTime() + 49 * 60 * 60 * 1000).toISOString(),
            updated_at: weekAgo.toISOString()
        },
        {
            customer_wechat: '本周客户3',
            sales_code: allSalesCodes[6], // 周九
            amount: 399,
            actual_payment_amount: 399,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(weekAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(weekAgo.getTime() + 73 * 60 * 60 * 1000).toISOString(),
            updated_at: weekAgo.toISOString()
        },
        {
            customer_wechat: '本周客户4',
            sales_code: allSalesCodes[1], // 李四
            amount: 999,
            actual_payment_amount: 999,
            duration: '1year',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: twoDaysAgo.toISOString(),
            payment_time: twoDaysAgo.toISOString(),
            updated_at: twoDaysAgo.toISOString()
        },
        
        // 本月的订单（8-29天前）- 5笔
        {
            customer_wechat: '本月客户1',
            sales_code: allSalesCodes[0], // 张三
            amount: 1999,
            actual_payment_amount: 1999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(monthAgo.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(monthAgo.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: monthAgo.toISOString()
        },
        {
            customer_wechat: '本月客户2',
            sales_code: allSalesCodes[1], // 李四
            amount: 799,
            actual_payment_amount: 799,
            duration: '6months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(monthAgo.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(monthAgo.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: monthAgo.toISOString()
        },
        {
            customer_wechat: '本月客户3',
            sales_code: allSalesCodes[2], // 王五
            amount: 499,
            actual_payment_amount: 499,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: twoWeeksAgo.toISOString(),
            payment_time: twoWeeksAgo.toISOString(),
            updated_at: twoWeeksAgo.toISOString()
        },
        {
            customer_wechat: '本月客户4',
            sales_code: allSalesCodes[5], // 孙八
            amount: 1299,
            actual_payment_amount: 1299,
            duration: '1year',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(monthAgo.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(monthAgo.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: monthAgo.toISOString()
        },
        {
            customer_wechat: '本月客户5',
            sales_code: allSalesCodes[3], // 赵六
            amount: 299,
            actual_payment_amount: 299,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(monthAgo.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(monthAgo.getTime() + 26 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: monthAgo.toISOString()
        },
        
        // 本年的订单（2-11个月前）- 6笔
        {
            customer_wechat: '本年客户1',
            sales_code: allSalesCodes[0], // 张三
            amount: 2999,
            actual_payment_amount: 2999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(yearAgo.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yearAgo.getTime() + 61 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: yearAgo.toISOString()
        },
        {
            customer_wechat: '本年客户2',
            sales_code: allSalesCodes[1], // 李四
            amount: 1599,
            actual_payment_amount: 1599,
            duration: '1year',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(yearAgo.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yearAgo.getTime() + 121 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: yearAgo.toISOString()
        },
        {
            customer_wechat: '本年客户3',
            sales_code: allSalesCodes[2], // 王五
            amount: 999,
            actual_payment_amount: 999,
            duration: '6months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: new Date(yearAgo.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yearAgo.getTime() + 181 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: yearAgo.toISOString()
        },
        {
            customer_wechat: '本年客户4',
            sales_code: allSalesCodes[0], // 张三
            amount: 699,
            actual_payment_amount: 699,
            duration: '6months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(yearAgo.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yearAgo.getTime() + 241 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: yearAgo.toISOString()
        },
        {
            customer_wechat: '本年客户5',
            sales_code: allSalesCodes[5], // 孙八
            amount: 1999,
            actual_payment_amount: 1999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: twoMonthsAgo.toISOString(),
            payment_time: twoMonthsAgo.toISOString(),
            updated_at: twoMonthsAgo.toISOString()
        },
        {
            customer_wechat: '本年客户6',
            sales_code: allSalesCodes[1], // 李四
            amount: 399,
            actual_payment_amount: 399,
            duration: '3months',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: new Date(yearAgo.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString(),
            payment_time: new Date(yearAgo.getTime() + 301 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: yearAgo.toISOString()
        },
        
        // 添加一些未确认的订单
        {
            customer_wechat: '待确认客户1',
            sales_code: allSalesCodes[0],
            amount: 599,
            actual_payment_amount: null,
            duration: '6months',
            payment_method: 'crypto',
            status: 'pending_payment',
            created_at: today.toISOString(),
            payment_time: null,
            updated_at: now.toISOString()
        },
        {
            customer_wechat: '待确认客户2',
            sales_code: allSalesCodes[1],
            amount: 299,
            actual_payment_amount: null,
            duration: '3months',
            payment_method: 'alipay',
            status: 'pending_config',
            created_at: yesterday.toISOString(),
            payment_time: null,
            updated_at: yesterday.toISOString()
        }
    ];
    
    const createdOrders = [];
    for (const order of testOrders) {
        const { data, error } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single();
        
        if (!error) {
            console.log(`✅ 创建订单: ${order.customer_wechat} - $${order.amount}`);
            createdOrders.push(data);
        } else {
            console.error(`❌ 创建订单失败: ${order.customer_wechat}`, error);
        }
    }
    
    // 步骤4: 验证数据统计
    console.log('\n📊 步骤4: 验证数据统计...');
    
    // 统计今天的订单
    const todayOrders = createdOrders.filter(o => {
        const orderDate = new Date(o.payment_time || o.created_at);
        return orderDate >= today && orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    
    // 统计本周的订单
    const weekOrders = createdOrders.filter(o => {
        const orderDate = new Date(o.payment_time || o.created_at);
        return orderDate >= weekAgo;
    });
    
    // 统计本月的订单
    const monthOrders = createdOrders.filter(o => {
        const orderDate = new Date(o.payment_time || o.created_at);
        return orderDate >= monthAgo;
    });
    
    // 统计本年的订单
    const yearOrders = createdOrders.filter(o => {
        const orderDate = new Date(o.payment_time || o.created_at);
        return orderDate >= yearAgo;
    });
    
    console.log('\n📈 数据统计结果:');
    console.log('================');
    console.log(`今天: ${todayOrders.length} 笔订单, 总金额: $${todayOrders.reduce((sum, o) => sum + (o.actual_payment_amount || 0), 0)}`);
    console.log(`本周: ${weekOrders.length} 笔订单, 总金额: $${weekOrders.reduce((sum, o) => sum + (o.actual_payment_amount || 0), 0)}`);
    console.log(`本月: ${monthOrders.length} 笔订单, 总金额: $${monthOrders.reduce((sum, o) => sum + (o.actual_payment_amount || 0), 0)}`);
    console.log(`本年: ${yearOrders.length} 笔订单, 总金额: $${yearOrders.reduce((sum, o) => sum + (o.actual_payment_amount || 0), 0)}`);
    
    // 统计销售排名
    const salesRanking = {};
    createdOrders.forEach(order => {
        if (order.status === 'confirmed' && order.actual_payment_amount) {
            const code = order.sales_code;
            if (!salesRanking[code]) {
                salesRanking[code] = {
                    sales_code: code,
                    total_amount: 0,
                    order_count: 0
                };
            }
            salesRanking[code].total_amount += order.actual_payment_amount;
            salesRanking[code].order_count += 1;
        }
    });
    
    const top5Sales = Object.values(salesRanking)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5);
    
    console.log('\n🏆 Top5 销售排行:');
    console.log('================');
    top5Sales.forEach((sale, index) => {
        // 查找销售名称
        const primarySale = createdPrimarySales.find(s => s.sales_code === sale.sales_code);
        const secondarySale = createdSecondarySales.find(s => s.sales_code === sale.sales_code);
        const salesName = primarySale?.wechat_name || secondarySale?.wechat_name || '未知';
        
        console.log(`${index + 1}. ${salesName}: $${sale.total_amount} (${sale.order_count}笔)`);
    });
    
    console.log('\n✨ 测试数据生成完成！');
    console.log('\n💡 使用提示:');
    console.log('1. 访问 /admin/dashboard 查看数据概览');
    console.log('2. 切换时间范围（今天/本周/本月/本年）查看数据变化');
    console.log('3. 检查Top5销售排行榜是否正确显示');
    console.log('4. 访问 /admin/finance 查看资金统计');
    console.log('5. 运行"清理完整测试数据.js"可删除所有测试数据');
    
    return {
        sales: {
            primary: createdPrimarySales,
            secondary: createdSecondarySales
        },
        orders: createdOrders,
        stats: {
            today: todayOrders.length,
            week: weekOrders.length,
            month: monthOrders.length,
            year: yearOrders.length,
            top5: top5Sales
        }
    };
})();
