// 修复版 - 在浏览器控制台运行此脚本生成测试数据
// 先确保在 https://zhixing-seven.vercel.app 网站上运行

(async function() {
    console.log('🚀 开始生成测试数据...\n');
    console.log('⏳ 正在初始化Supabase客户端...');
    
    // 方法1：尝试从全局变量获取
    let supabase = window.supabaseClient;
    
    // 方法2：如果没有，手动创建
    if (!supabase) {
        console.log('📦 手动创建Supabase客户端...');
        
        // 动态加载Supabase库
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            // 等待脚本加载
            await new Promise((resolve) => {
                script.onload = resolve;
                setTimeout(resolve, 2000); // 最多等待2秒
            });
        }
        
        // 创建客户端
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        } else {
            console.error('❌ 无法加载Supabase库');
            console.log('💡 请确保在 https://zhixing-seven.vercel.app 网站上运行此脚本');
            return;
        }
    }
    
    console.log('✅ Supabase客户端就绪');
    
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
    console.log('\n📋 步骤1: 创建测试销售人员...');
    
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
            sales_code: 'PRI_LI4_' + (Date.now() + 1),
            commission_rate: 0.35,
            created_at: twoMonthsAgo.toISOString()
        },
        {
            wechat_name: '测试销售王五',
            name: '王五',
            sales_code: 'PRI_WANG5_' + (Date.now() + 2),
            commission_rate: 0.38,
            created_at: twoMonthsAgo.toISOString()
        }
    ];
    
    const createdPrimarySales = [];
    for (const sale of testPrimarySales) {
        try {
            const { data, error } = await supabase
                .from('primary_sales')
                .insert(sale)
                .select()
                .single();
            
            if (!error && data) {
                console.log(`✅ 创建一级销售: ${sale.wechat_name}`);
                createdPrimarySales.push(data);
            } else if (error) {
                console.error(`❌ 创建失败: ${sale.wechat_name}`, error);
            }
        } catch (err) {
            console.error(`❌ 异常: ${sale.wechat_name}`, err);
        }
    }
    
    if (createdPrimarySales.length === 0) {
        console.error('❌ 未能创建任何一级销售，终止执行');
        return;
    }
    
    // 步骤2: 创建二级销售
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
            sales_code: 'SEC_QIAN7_' + (Date.now() + 1),
            commission_rate: 0.25,
            primary_sales_id: createdPrimarySales[0]?.id, // 属于张三
            created_at: twoWeeksAgo.toISOString()
        },
        {
            wechat_name: '测试独立孙八',
            name: '孙八',
            sales_code: 'SEC_SUN8_' + (Date.now() + 2),
            commission_rate: 0.3,
            primary_sales_id: null, // 独立销售
            created_at: monthAgo.toISOString()
        },
        {
            wechat_name: '测试二级周九',
            name: '周九',
            sales_code: 'SEC_ZHOU9_' + (Date.now() + 3),
            commission_rate: 0.25,
            primary_sales_id: createdPrimarySales[1]?.id, // 属于李四
            created_at: monthAgo.toISOString()
        }
    ];
    
    const createdSecondarySales = [];
    for (const sale of testSecondarySales) {
        try {
            const { data, error } = await supabase
                .from('secondary_sales')
                .insert(sale)
                .select()
                .single();
            
            if (!error && data) {
                console.log(`✅ 创建二级销售: ${sale.wechat_name}`);
                createdSecondarySales.push(data);
            } else if (error) {
                console.error(`❌ 创建失败: ${sale.wechat_name}`, error);
            }
        } catch (err) {
            console.error(`❌ 异常: ${sale.wechat_name}`, err);
        }
    }
    
    // 合并所有销售代码
    const allSalesCodes = [
        ...createdPrimarySales.map(s => s.sales_code),
        ...createdSecondarySales.map(s => s.sales_code)
    ];
    
    // 步骤3: 创建订单
    console.log('\n📋 步骤3: 创建测试订单...');
    
    // 简化订单数据，创建20个订单覆盖不同时间段
    const orderTemplates = [
        // 今天 - 3笔
        { time: today, prefix: '今日客户', count: 3 },
        // 昨天 - 2笔
        { time: yesterday, prefix: '昨日客户', count: 2 },
        // 本周 - 3笔
        { time: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), prefix: '本周客户', count: 3 },
        // 本月 - 4笔
        { time: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), prefix: '本月客户', count: 4 },
        // 本年 - 3笔
        { time: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000), prefix: '本年客户', count: 3 }
    ];
    
    const createdOrders = [];
    let orderIndex = 0;
    
    for (const template of orderTemplates) {
        for (let i = 0; i < template.count; i++) {
            const salesCode = allSalesCodes[orderIndex % allSalesCodes.length];
            const amount = [99, 199, 299, 599, 999, 1299, 1999][Math.floor(Math.random() * 7)];
            
            const order = {
                customer_wechat: `${template.prefix}${i + 1}`,
                sales_code: salesCode,
                amount: amount,
                actual_payment_amount: amount,
                duration: ['1month', '3months', '6months', '1year'][Math.floor(Math.random() * 4)],
                payment_method: Math.random() > 0.5 ? 'crypto' : 'alipay',
                status: 'confirmed',
                created_at: new Date(template.time.getTime() + i * 60 * 60 * 1000).toISOString(),
                payment_time: new Date(template.time.getTime() + (i + 1) * 60 * 60 * 1000).toISOString(),
                updated_at: now.toISOString()
            };
            
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .insert(order)
                    .select()
                    .single();
                
                if (!error && data) {
                    console.log(`✅ 创建订单: ${order.customer_wechat} - $${order.amount}`);
                    createdOrders.push(data);
                } else if (error) {
                    console.error(`❌ 订单失败: ${order.customer_wechat}`, error.message);
                }
            } catch (err) {
                console.error(`❌ 订单异常:`, err);
            }
            
            orderIndex++;
        }
    }
    
    // 统计结果
    console.log('\n📊 生成结果统计:');
    console.log('=================');
    console.log(`一级销售: ${createdPrimarySales.length} 个`);
    console.log(`二级销售: ${createdSecondarySales.length} 个`);
    console.log(`订单总数: ${createdOrders.length} 笔`);
    
    // 按时间统计订单
    const todayCount = createdOrders.filter(o => {
        const d = new Date(o.payment_time);
        return d >= today && d < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;
    
    const weekCount = createdOrders.filter(o => {
        const d = new Date(o.payment_time);
        return d >= weekAgo;
    }).length;
    
    console.log(`\n📅 时间分布:`);
    console.log(`今天: ${todayCount} 笔`);
    console.log(`本周: ${weekCount} 笔`);
    console.log(`全部: ${createdOrders.length} 笔`);
    
    console.log('\n✨ 测试数据生成完成！');
    console.log('\n💡 下一步操作:');
    console.log('1. 访问 https://zhixing-seven.vercel.app/admin/dashboard');
    console.log('2. 切换时间范围（今天/本周/本月/本年）查看数据变化');
    console.log('3. 检查Top5销售排行榜是否显示');
    console.log('4. 访问 /admin/finance 查看资金统计');
    console.log('5. 完成测试后运行清理脚本删除测试数据');
    
    return {
        sales: {
            primary: createdPrimarySales,
            secondary: createdSecondarySales
        },
        orders: createdOrders
    };
})();
