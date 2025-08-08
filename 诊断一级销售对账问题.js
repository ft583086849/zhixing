// 在浏览器控制台运行此脚本，诊断一级销售对账页面问题
// 使用前请先登录并访问 /primary-sales-settlement 页面

(async function() {
    console.log('🔍 开始诊断一级销售对账问题...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 步骤1：输入要查询的一级销售
    const primaryWechat = prompt('请输入一级销售微信号（如：测试测试、88晚上）:');
    if (!primaryWechat) {
        console.log('❌ 已取消');
        return;
    }
    
    console.log(`📋 查询一级销售：${primaryWechat}`);
    
    // 步骤2：查找一级销售
    const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .eq('wechat_name', primaryWechat)
        .single();
    
    if (primaryError || !primarySales) {
        console.error('❌ 未找到一级销售:', primaryError);
        console.log('💡 提示：请确认微信号是否正确');
        return;
    }
    
    console.log('✅ 找到一级销售:', {
        id: primarySales.id,
        wechat_name: primarySales.wechat_name,
        sales_code: primarySales.sales_code,
        commission_rate: primarySales.commission_rate,
        secondary_registration_code: primarySales.secondary_registration_code
    });
    
    // 步骤3：查找所有关联的二级销售
    console.log('\n📋 查找关联的二级销售...');
    
    const { data: secondarySales, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primarySales.id)
        .order('created_at', { ascending: false });
    
    if (secondaryError) {
        console.error('❌ 查询二级销售失败:', secondaryError);
        return;
    }
    
    if (!secondarySales || secondarySales.length === 0) {
        console.log('⚠️ 该一级销售下没有二级销售');
        console.log(`💡 二级销售注册链接: ${window.location.origin}/secondary-registration/${primarySales.sales_code}`);
        console.log(`💡 或使用注册码: ${primarySales.secondary_registration_code}`);
    } else {
        console.log(`✅ 找到 ${secondarySales.length} 个二级销售:`);
        
        for (const secondary of secondarySales) {
            // 获取该二级销售的订单统计
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('sales_code', secondary.sales_code);
            
            const confirmedOrders = orders?.filter(o => 
                ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
            ) || [];
            
            const totalAmount = confirmedOrders.reduce((sum, o) => 
                sum + (o.actual_payment_amount || o.amount || 0), 0
            );
            
            console.log(`\n  📌 ${secondary.wechat_name}:`);
            console.log(`     - ID: ${secondary.id}`);
            console.log(`     - Sales Code: ${secondary.sales_code}`);
            console.log(`     - 佣金率: ${secondary.commission_rate ? (secondary.commission_rate * 100).toFixed(1) + '%' : '未设置'}`);
            console.log(`     - 订单数: 总计${orders?.length || 0}个，已确认${confirmedOrders.length}个`);
            console.log(`     - 订单金额: $${totalAmount.toFixed(2)}`);
            console.log(`     - 创建时间: ${new Date(secondary.created_at).toLocaleDateString()}`);
        }
    }
    
    // 步骤4：测试 API 调用
    console.log('\n📋 测试 getPrimarySalesSettlement API...');
    
    try {
        // 尝试调用API
        const apiResponse = await fetch(`${window.location.origin}/api/sales/primary-settlement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wechat_name: primaryWechat
            })
        });
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            console.log('✅ API 返回数据:', {
                sales: data.sales ? '有' : '无',
                secondarySales: data.secondarySales ? `${data.secondarySales.length}个` : '无',
                orders: data.orders ? `${data.orders.length}个` : '无',
                stats: data.stats ? '有' : '无'
            });
            
            if (data.secondarySales && data.secondarySales.length > 0) {
                console.log('\n📌 API返回的二级销售列表:');
                data.secondarySales.forEach(s => {
                    console.log(`  - ${s.wechat_name}: 佣金率${s.commission_rate ? (s.commission_rate * 100).toFixed(1) + '%' : '未设置'}`);
                });
            }
        } else {
            console.error('❌ API 调用失败:', apiResponse.status);
        }
    } catch (err) {
        console.log('⚠️ 无法直接调用API，这是正常的');
    }
    
    // 步骤5：建议
    console.log('\n💡 诊断建议:');
    
    if (!secondarySales || secondarySales.length === 0) {
        console.log('1. 当前没有二级销售，需要先邀请二级销售注册');
        console.log('2. 分享注册链接给二级销售');
        console.log('3. 二级销售注册后会自动关联到您名下');
    } else {
        console.log('1. 已找到二级销售，请检查对账页面是否正常显示');
        console.log('2. 如果页面不显示，可能是缓存问题，请刷新页面');
        console.log('3. 确保搜索时输入完整的微信号');
        
        // 检查是否有未设置佣金的二级销售
        const unsetCommission = secondarySales.filter(s => !s.commission_rate || s.commission_rate === 0);
        if (unsetCommission.length > 0) {
            console.log(`\n⚠️ 有 ${unsetCommission.length} 个二级销售未设置佣金率:`);
            unsetCommission.forEach(s => {
                console.log(`  - ${s.wechat_name}`);
            });
            console.log('💡 请在对账页面为他们设置佣金率');
        }
    }
    
    return {
        primary: primarySales,
        secondary: secondarySales
    };
})();
