// 🔍 诊断独立注册二级销售失败原因
// 请在 https://zhixing-seven.vercel.app/secondary-sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 诊断独立注册二级销售失败原因...');
    console.log('='.repeat(60));
    
    try {
        // 1. 获取Supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        console.log('✅ Supabase客户端已找到');
        
        // 2. 检查当前用户认证状态
        console.log('\n🔍 步骤1: 检查用户认证状态...');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError) {
            console.log('⚠️ 未登录或认证错误:', authError);
        } else if (user) {
            console.log('✅ 已登录用户:', user.email);
        } else {
            console.log('ℹ️ 匿名访问（未登录）');
        }
        
        // 3. 测试创建独立二级销售
        console.log('\n🔍 步骤2: 测试创建独立二级销售...');
        
        const testData = {
            wechat_name: 'test_independent_' + Date.now(),
            crypto_address: '0x' + Math.random().toString(36).substring(2, 15),
            sales_code: 'SEC' + Date.now(),
            commission_rate: 30,
            payment_method: 'crypto',
            sales_type: 'secondary',
            primary_sales_id: null,  // 独立注册，无上级
            created_at: new Date().toISOString()
        };
        
        console.log('测试数据:');
        console.log(JSON.stringify(testData, null, 2));
        
        // 4. 尝试直接插入
        console.log('\n🔍 步骤3: 尝试插入数据到secondary_sales表...');
        const { data: insertResult, error: insertError } = await supabaseClient
            .from('secondary_sales')
            .insert([testData])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ 插入失败！');
            console.log('错误代码:', insertError.code);
            console.log('错误消息:', insertError.message);
            console.log('错误详情:', insertError.details);
            console.log('错误提示:', insertError.hint);
            
            // 分析具体错误原因
            console.log('\n📊 错误分析:');
            
            if (insertError.code === '42501') {
                console.log('🔒 权限问题: 没有INSERT权限');
                console.log('需要检查Supabase的RLS（行级安全）策略');
                
                // 检查RLS状态
                console.log('\n检查表的RLS策略...');
                const { data: policies } = await supabaseClient
                    .rpc('get_policies', { table_name: 'secondary_sales' })
                    .catch(() => ({ data: null }));
                
                if (policies) {
                    console.log('RLS策略:', policies);
                } else {
                    console.log('⚠️ 无法获取RLS策略信息');
                    console.log('\n💡 解决方案:');
                    console.log('1. 登录Supabase控制台');
                    console.log('2. 进入 Authentication > Policies');
                    console.log('3. 找到 secondary_sales 表');
                    console.log('4. 添加 INSERT 策略允许匿名插入');
                    console.log('   或者暂时禁用RLS（仅用于测试）');
                }
            } else if (insertError.code === '23505') {
                console.log('🔑 唯一性冲突: sales_code可能重复');
                console.log('解决方案: 确保生成唯一的sales_code');
            } else if (insertError.code === '23502') {
                console.log('❗ 非空约束: 某个必填字段为空');
                console.log('缺少的字段:', insertError.details);
            } else if (insertError.code === '42703') {
                console.log('📋 字段不存在: 表结构可能不匹配');
                console.log('问题字段:', insertError.message);
                
                // 获取表结构
                console.log('\n检查表结构...');
                const { data: emptyQuery } = await supabaseClient
                    .from('secondary_sales')
                    .select('*')
                    .limit(0);
                
                console.log('表字段:', Object.keys(emptyQuery || {}));
            } else {
                console.log('❓ 其他错误类型');
                console.log('可能原因:');
                console.log('- 网络问题');
                console.log('- Supabase服务问题');
                console.log('- 数据格式问题');
            }
            
            // 5. 尝试其他方法
            console.log('\n🔍 步骤4: 尝试简化数据结构...');
            const minimalData = {
                wechat_name: 'test_min_' + Date.now(),
                crypto_address: '0x' + Date.now(),
                sales_code: 'SEC' + Date.now().toString().slice(-10),
                commission_rate: 30
            };
            
            console.log('最简数据:');
            console.log(JSON.stringify(minimalData, null, 2));
            
            const { data: minimalResult, error: minimalError } = await supabaseClient
                .from('secondary_sales')
                .insert([minimalData])
                .select()
                .single();
            
            if (minimalError) {
                console.error('❌ 最简数据也失败:', minimalError.message);
            } else {
                console.log('✅ 最简数据插入成功！');
                console.log('成功的记录:', minimalResult);
                
                // 清理测试数据
                await supabaseClient
                    .from('secondary_sales')
                    .delete()
                    .eq('id', minimalResult.id);
                
                console.log('✅ 测试数据已清理');
                console.log('\n💡 问题可能出在某些字段上，建议检查:');
                console.log('- payment_method 字段');
                console.log('- sales_type 字段');
                console.log('- primary_sales_id 字段');
            }
            
        } else {
            console.log('✅ 插入成功！');
            console.log('创建的记录:', insertResult);
            
            // 清理测试数据
            console.log('\n🧹 清理测试数据...');
            const { error: deleteError } = await supabaseClient
                .from('secondary_sales')
                .delete()
                .eq('id', insertResult.id);
            
            if (!deleteError) {
                console.log('✅ 测试数据已清理');
            }
            
            console.log('\n✅ 系统功能正常！');
            console.log('可能的失败原因:');
            console.log('1. 用户输入的数据格式问题');
            console.log('2. 网络不稳定');
            console.log('3. 前端验证问题');
        }
        
        // 6. 检查前端页面状态
        console.log('\n🔍 步骤5: 检查前端页面状态...');
        
        // 检查是否有salesAPI
        if (window.salesAPI) {
            console.log('✅ 找到全局salesAPI');
        } else {
            console.log('⚠️ 未找到全局salesAPI，尝试导入...');
            try {
                const { salesAPI } = await import('/src/services/api.js').catch(() => ({}));
                if (salesAPI) {
                    console.log('✅ 成功导入salesAPI');
                } else {
                    console.log('❌ 无法导入salesAPI');
                }
            } catch (e) {
                console.log('❌ 导入失败:', e.message);
            }
        }
        
        // 7. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        console.log(`  当前页面: ${window.location.pathname}`);
        console.log(`  Supabase客户端: ${supabaseClient ? '✅' : '❌'}`);
        console.log(`  用户认证: ${user ? '已登录' : '未登录'}`);
        console.log('='.repeat(60));
        
        console.log('\n💡 建议下一步:');
        console.log('1. 查看浏览器控制台的Network标签，找到失败的请求');
        console.log('2. 查看请求的响应详情，特别是错误消息');
        console.log('3. 如果是权限问题，需要在Supabase控制台调整RLS策略');
        console.log('4. 如果是字段问题，需要检查表结构是否正确');
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
