// 🚀 快速修复并测试二级销售创建
// 请在 https://zhixing-seven.vercel.app/secondary-sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🚀 快速修复并测试...');
    console.log('='.repeat(60));
    
    // 1. 直接绕过前端，使用Supabase创建
    console.log('\n方案1: 直接使用Supabase创建二级销售');
    console.log('复制以下代码在控制台运行:');
    
    const code1 = `
// 直接创建二级销售
(async () => {
    const supabase = window.supabaseClient || window.supabase;
    const timestamp = Date.now().toString().slice(-6);
    
    const { data, error } = await supabase
        .from('secondary_sales')
        .insert([{
            wechat_name: '独立销售' + timestamp,
            crypto_address: '0x1234567890' + timestamp,
            sales_code: 'SEC' + timestamp,
            commission_rate: 30
        }])
        .select()
        .single();
    
    if (error) {
        console.error('创建失败:', error);
    } else {
        console.log('✅ 创建成功！');
        console.log('销售码:', data.sales_code);
        console.log('用户购买链接:', location.origin + '/purchase?sales_code=' + data.sales_code);
    }
})();`;
    
    console.log(code1);
    
    // 2. 修复前端API调用
    console.log('\n' + '='.repeat(60));
    console.log('方案2: 注入修复后的API函数');
    console.log('复制以下代码在控制台运行:');
    
    const code2 = `
// 注入修复后的创建函数
window.createSecondarySales = async function(formData) {
    const supabase = window.supabaseClient || window.supabase;
    const timestamp = Date.now().toString();
    
    try {
        const salesData = {
            wechat_name: formData.wechat_name || '测试销售',
            crypto_address: formData.crypto_address || '0x' + timestamp,
            sales_code: 'SEC' + timestamp.slice(-10),
            commission_rate: 30,
            payment_method: 'crypto',
            sales_type: 'secondary',
            created_at: new Date().toISOString()
        };
        
        console.log('提交数据:', salesData);
        
        const { data, error } = await supabase
            .from('secondary_sales')
            .insert([salesData])
            .select()
            .single();
        
        if (error) {
            console.error('创建失败:', error);
            alert('创建失败: ' + error.message);
            return null;
        }
        
        const purchaseLink = location.origin + '/purchase?sales_code=' + data.sales_code;
        
        console.log('✅ 创建成功！');
        console.log('销售信息:', data);
        console.log('用户购买链接:', purchaseLink);
        
        // 复制到剪贴板
        try {
            await navigator.clipboard.writeText(purchaseLink);
            alert('创建成功！购买链接已复制到剪贴板:\\n' + purchaseLink);
        } catch (e) {
            alert('创建成功！购买链接:\\n' + purchaseLink);
        }
        
        return data;
    } catch (err) {
        console.error('错误:', err);
        alert('创建失败: ' + err.message);
        return null;
    }
};

// 使用示例
console.log('使用方法: window.createSecondarySales({ wechat_name: "您的微信名", crypto_address: "您的钱包地址" })');
`;
    
    console.log(code2);
    
    // 3. 检查具体错误
    console.log('\n' + '='.repeat(60));
    console.log('诊断: 检查最近的错误');
    
    // 查看是否有现有的二级销售
    const supabase = window.supabaseClient || window.supabase;
    if (supabase) {
        const { data: recent, error } = await supabase
            .from('secondary_sales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (recent && recent.length > 0) {
            console.log('\n最近创建的二级销售:');
            recent.forEach(s => {
                console.log(`  ${s.wechat_name} - ${s.sales_code} - ${new Date(s.created_at).toLocaleString()}`);
            });
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 总结:');
    console.log('1. 如果RLS已禁用但仍失败，可能是表结构问题');
    console.log('2. 使用方案1可以直接创建（绕过前端）');
    console.log('3. 使用方案2可以测试并获得详细错误信息');
    console.log('4. 查看浏览器控制台的错误信息');
    console.log('='.repeat(60));
})();
