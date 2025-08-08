// 🔍 测试独立注册API调用
// 请在 https://zhixing-seven.vercel.app/secondary-sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 测试独立注册API调用...');
    console.log('='.repeat(60));
    
    try {
        // 1. 导入salesAPI
        console.log('\n🔍 步骤1: 导入salesAPI...');
        let salesAPI;
        
        // 尝试从window获取
        if (window.salesAPI) {
            salesAPI = window.salesAPI;
            console.log('✅ 使用全局salesAPI');
        } else {
            // 尝试动态导入
            try {
                const module = await import('/src/services/api.js');
                salesAPI = module.salesAPI;
                console.log('✅ 动态导入salesAPI成功');
            } catch (e) {
                console.log('⚠️ 无法导入，尝试直接使用Supabase...');
            }
        }
        
        // 2. 准备测试数据
        console.log('\n🔍 步骤2: 准备测试数据...');
        const testData = {
            wechat_name: '测试独立' + Date.now().toString().slice(-6),
            crypto_address: '0xTest' + Date.now().toString().slice(-10),
            payment_method: 'crypto',
            sales_type: 'secondary'
        };
        
        console.log('测试数据:');
        console.log(JSON.stringify(testData, null, 2));
        
        // 3. 尝试使用salesAPI注册
        if (salesAPI && salesAPI.registerSecondary) {
            console.log('\n🔍 步骤3: 使用salesAPI.registerSecondary...');
            
            try {
                const response = await salesAPI.registerSecondary(testData);
                
                if (response.success) {
                    console.log('✅ 注册成功！');
                    console.log('返回数据:', response.data);
                    
                    // 清理测试数据
                    console.log('\n🧹 清理测试数据...');
                    const supabase = window.supabaseClient || window.supabase;
                    if (supabase && response.data?.id) {
                        await supabase
                            .from('secondary_sales')
                            .delete()
                            .eq('id', response.data.id);
                        console.log('✅ 测试数据已清理');
                    }
                } else {
                    console.error('❌ 注册失败:', response.message);
                    console.log('完整响应:', response);
                }
            } catch (error) {
                console.error('❌ API调用出错:', error);
                console.log('错误详情:', {
                    message: error.message,
                    stack: error.stack,
                    response: error.response
                });
            }
        } else {
            // 4. 直接使用Supabase
            console.log('\n🔍 步骤3: 直接使用Supabase...');
            const supabase = window.supabaseClient || window.supabase;
            
            if (!supabase) {
                console.error('❌ 未找到Supabase客户端');
                return;
            }
            
            // 生成销售码
            testData.sales_code = 'SEC' + Date.now();
            testData.commission_rate = 30;
            testData.created_at = new Date().toISOString();
            
            console.log('完整数据:');
            console.log(JSON.stringify(testData, null, 2));
            
            const { data, error } = await supabase
                .from('secondary_sales')
                .insert([testData])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Supabase插入失败!');
                console.log('错误信息:', error);
                
                // 详细错误分析
                console.log('\n📊 详细错误分析:');
                console.log('错误代码:', error.code);
                console.log('错误消息:', error.message);
                console.log('错误详情:', error.details);
                console.log('错误提示:', error.hint);
                
                if (error.code === '42501') {
                    console.log('\n🔒 这是权限问题！');
                    console.log('解决方案:');
                    console.log('1. 登录 Supabase Dashboard');
                    console.log('2. 找到 secondary_sales 表');
                    console.log('3. 检查 RLS (Row Level Security) 策略');
                    console.log('4. 确保有允许 INSERT 的策略');
                    console.log('\n或者临时解决（仅测试）:');
                    console.log('ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;');
                }
            } else {
                console.log('✅ 直接插入成功！');
                console.log('创建的记录:', data);
                
                // 清理
                await supabase
                    .from('secondary_sales')
                    .delete()
                    .eq('id', data.id);
                console.log('✅ 测试数据已清理');
            }
        }
        
        // 5. 检查网络请求
        console.log('\n💡 调试建议:');
        console.log('1. 打开 Chrome DevTools 的 Network 标签');
        console.log('2. 重新尝试注册操作');
        console.log('3. 找到失败的请求（红色）');
        console.log('4. 查看 Response 标签中的错误详情');
        console.log('5. 特别注意 error.code 和 error.message');
        
        console.log('\n' + '='.repeat(60));
        console.log('测试完成！');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('测试过程出错:', error);
    }
})();
