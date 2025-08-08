// 🔍 诊断销售注册问题
// 在控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 诊断销售注册问题');
    console.log('='.repeat(60));
    
    // 1. 检查一级销售注册返回的数据
    console.log('\n📊 测试一级销售注册API返回值：');
    
    // 模拟API调用
    const testCreatePrimarySales = async () => {
        try {
            const { salesAPI } = await import('/src/services/api.js');
            const testData = {
                wechat_name: 'test_' + Date.now(),
                payment_method: 'crypto',
                chain_name: 'TRC20',
                payment_address: 'test_address'
            };
            
            const response = await salesAPI.createPrimarySales(testData);
            console.log('API响应:', response);
            
            if (response.success && response.data) {
                console.log('\n✅ 返回的链接数据:');
                console.log('  user_sales_link:', response.data.user_sales_link);
                console.log('  user_sales_code:', response.data.user_sales_code || '❌ 缺失');
                console.log('  sales_code:', response.data.sales_code || '❌ 缺失');
                console.log('  secondary_registration_link:', response.data.secondary_registration_link);
                console.log('  secondary_registration_code:', response.data.secondary_registration_code || '❌ 缺失');
            }
        } catch (error) {
            console.error('测试失败:', error);
        }
    };
    
    // 2. 检查二级销售注册码验证
    console.log('\n📊 测试二级销售注册码验证：');
    const registrationCode = 'SEC17546345796242856';
    console.log('  注册码:', registrationCode);
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 查找对应的一级销售
        const { data: primarySales, error } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .eq('secondary_registration_code', registrationCode)
            .single();
        
        if (error) {
            console.error('  ❌ 查询失败:', error.message);
        } else if (primarySales) {
            console.log('  ✅ 找到对应的一级销售:');
            console.log('    销售代码:', primarySales.sales_code);
            console.log('    微信号:', primarySales.wechat_name);
            console.log('    ID:', primarySales.id);
        } else {
            console.log('  ❌ 未找到对应的一级销售');
        }
    } catch (error) {
        console.error('验证失败:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('诊断完成');
    console.log('='.repeat(60));
})();
