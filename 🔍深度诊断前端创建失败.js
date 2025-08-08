// 🔍 深度诊断前端创建失败（非权限问题）
// 请在 https://zhixing-seven.vercel.app/secondary-sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 深度诊断前端创建失败原因...');
    console.log('='.repeat(60));
    
    try {
        // 1. 检查Supabase连接
        console.log('\n🔍 步骤1: 检查Supabase连接...');
        const supabase = window.supabaseClient || window.supabase;
        if (!supabase) {
            console.error('❌ Supabase客户端未找到！');
            return;
        }
        console.log('✅ Supabase客户端存在');
        
        // 测试连接
        const { data: testConnection, error: connError } = await supabase
            .from('secondary_sales')
            .select('count')
            .limit(1);
        
        if (connError) {
            console.error('❌ Supabase连接测试失败:', connError);
        } else {
            console.log('✅ Supabase连接正常');
        }
        
        // 2. 检查表结构
        console.log('\n🔍 步骤2: 检查secondary_sales表结构...');
        const { data: sampleData, error: structError } = await supabase
            .from('secondary_sales')
            .select('*')
            .limit(1);
        
        if (structError && structError.code !== 'PGRST116') {
            console.error('❌ 无法读取表结构:', structError);
        } else {
            const columns = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : [];
            console.log('表字段:', columns.length > 0 ? columns : '表为空，无法确定字段');
            
            // 预期的必要字段
            const requiredFields = ['wechat_name', 'crypto_address', 'sales_code', 'commission_rate'];
            const missingFields = requiredFields.filter(f => columns.length > 0 && !columns.includes(f));
            
            if (missingFields.length > 0) {
                console.error('❌ 缺少必要字段:', missingFields);
            }
        }
        
        // 3. 模拟前端的创建流程
        console.log('\n🔍 步骤3: 模拟前端创建流程...');
        
        // 3.1 检查salesAPI
        console.log('检查salesAPI是否可用...');
        let salesAPI = null;
        
        // 尝试从各种来源获取salesAPI
        if (window.salesAPI) {
            salesAPI = window.salesAPI;
            console.log('✅ 找到window.salesAPI');
        } else {
            console.log('⚠️ window.salesAPI不存在');
            
            // 尝试从React组件获取
            const reactRoot = document.getElementById('root');
            if (reactRoot && reactRoot._reactRootContainer) {
                console.log('尝试从React组件获取...');
            }
        }
        
        // 3.2 检查SupabaseService
        console.log('\n检查SupabaseService...');
        if (window.SupabaseService) {
            console.log('✅ 找到window.SupabaseService');
        } else {
            console.log('⚠️ window.SupabaseService不存在');
        }
        
        // 4. 直接测试数据插入
        console.log('\n🔍 步骤4: 直接测试数据插入...');
        
        // 使用最简单的数据结构
        const timestamp = Date.now().toString().slice(-8);
        const minimalData = {
            wechat_name: 'test' + timestamp,
            crypto_address: '0x' + timestamp,
            sales_code: 'SEC' + timestamp,
            commission_rate: 30
        };
        
        console.log('最简测试数据:', minimalData);
        
        const { data: insertResult, error: insertError } = await supabase
            .from('secondary_sales')
            .insert([minimalData])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ 最简数据插入失败！');
            console.log('错误详情:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
            });
            
            // 分析具体错误
            if (insertError.message?.includes('duplicate key')) {
                console.log('📌 问题: sales_code重复');
            } else if (insertError.message?.includes('violates foreign key')) {
                console.log('📌 问题: 外键约束（可能是primary_sales_id）');
            } else if (insertError.message?.includes('null value')) {
                console.log('📌 问题: 必填字段为空');
            } else if (insertError.message?.includes('invalid input')) {
                console.log('📌 问题: 数据格式错误');
            }
        } else {
            console.log('✅ 最简数据插入成功！');
            console.log('插入的记录:', insertResult);
            
            // 清理
            await supabase.from('secondary_sales').delete().eq('id', insertResult.id);
            console.log('✅ 测试数据已清理');
            
            // 如果简单插入成功，测试完整数据
            console.log('\n🔍 步骤5: 测试完整数据结构...');
            const fullData = {
                wechat_name: 'full' + timestamp,
                crypto_address: '0xFull' + timestamp,
                sales_code: 'SEC' + timestamp + '2',
                commission_rate: 30,
                payment_method: 'crypto',
                sales_type: 'secondary',
                primary_sales_id: null,
                created_at: new Date().toISOString()
            };
            
            console.log('完整测试数据:', fullData);
            
            const { data: fullResult, error: fullError } = await supabase
                .from('secondary_sales')
                .insert([fullData])
                .select()
                .single();
            
            if (fullError) {
                console.error('❌ 完整数据插入失败！');
                console.log('错误详情:', fullError);
                console.log('\n📌 问题可能在这些额外字段:');
                console.log('- payment_method');
                console.log('- sales_type');
                console.log('- primary_sales_id');
                console.log('- created_at');
            } else {
                console.log('✅ 完整数据也插入成功！');
                await supabase.from('secondary_sales').delete().eq('id', fullResult.id);
                console.log('✅ 测试数据已清理');
            }
        }
        
        // 5. 检查前端表单数据
        console.log('\n🔍 步骤6: 检查前端表单状态...');
        
        // 尝试获取表单数据
        const formInputs = document.querySelectorAll('input, select, textarea');
        if (formInputs.length > 0) {
            console.log('找到的表单元素:');
            formInputs.forEach(input => {
                if (input.name || input.id) {
                    console.log(`  ${input.name || input.id}: "${input.value}"`);
                }
            });
        }
        
        // 6. 监听网络请求
        console.log('\n💡 网络请求监听建议:');
        console.log('1. 打开Chrome DevTools的Network标签');
        console.log('2. 筛选器输入: secondary');
        console.log('3. 重新尝试提交表单');
        console.log('4. 查看失败请求的:');
        console.log('   - Request Payload（发送的数据）');
        console.log('   - Response（返回的错误）');
        console.log('5. 特别注意Response中的error对象');
        
        // 7. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        console.log('  Supabase连接: ' + (connError ? '❌ 异常' : '✅ 正常'));
        console.log('  数据插入测试: ' + (insertResult ? '✅ 成功' : '❌ 失败'));
        console.log('  问题可能在: 前端数据处理或API调用链');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
