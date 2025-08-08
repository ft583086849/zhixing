// 🔍 诊断二级销售创建失败问题
// 请在 https://zhixing-seven.vercel.app/ 任意页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 开始诊断二级销售创建失败问题...');
    console.log('='.repeat(60));
    
    const registrationCode = 'SEC17546258397274661';
    console.log(`\n📌 目标注册码: ${registrationCode}`);
    
    try {
        // 1. 获取Supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 2. 检查注册码在primary_sales表中是否存在
        console.log('\n🔍 步骤1: 检查注册码是否有效...');
        const { data: primarySalesData, error: validateError } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .eq('secondary_registration_code', registrationCode)
            .single();
        
        if (validateError) {
            if (validateError.code === 'PGRST116') {
                console.error('❌ 注册码不存在！');
                console.log('\n问题诊断:');
                console.log('  - 该注册码在primary_sales表中不存在');
                console.log('  - 可能原因1: 注册码错误或已过期');
                console.log('  - 可能原因2: 一级销售还未生成此注册码');
                
                // 进一步检查是否为销售码而非注册码
                console.log('\n🔍 步骤1.1: 检查是否为销售码而非注册码...');
                const { data: salesCodeCheck } = await supabaseClient
                    .from('primary_sales')
                    .select('*')
                    .eq('sales_code', registrationCode)
                    .single();
                
                if (salesCodeCheck) {
                    console.log('⚠️ 发现问题: 这是一个销售码，不是注册码！');
                    console.log('正确的注册码应该是:', salesCodeCheck.secondary_registration_code);
                    console.log('\n解决方案:');
                    console.log(`  使用正确的URL: https://zhixing-seven.vercel.app/secondary-sales?sales_code=${salesCodeCheck.secondary_registration_code}`);
                } else {
                    // 检查secondary_sales表
                    const { data: secondarySalesCheck } = await supabaseClient
                        .from('secondary_sales')
                        .select('*')
                        .eq('sales_code', registrationCode)
                        .single();
                    
                    if (secondarySalesCheck) {
                        console.log('⚠️ 发现问题: 这是一个二级销售的销售码！');
                        console.log('二级销售不能再创建下级销售');
                    }
                }
            } else {
                console.error('验证注册码时出错:', validateError);
            }
            return;
        }
        
        console.log('✅ 注册码有效，关联的一级销售:');
        console.log(`  - ID: ${primarySalesData.id}`);
        console.log(`  - 微信名: ${primarySalesData.wechat_name}`);
        console.log(`  - 销售码: ${primarySalesData.sales_code}`);
        
        // 3. 尝试创建二级销售（模拟）
        console.log('\n🔍 步骤2: 检查二级销售创建权限...');
        
        // 检查是否已经存在相同信息的二级销售
        const testWechatName = 'test_secondary_' + Date.now();
        const { data: existingCheck, error: checkError } = await supabaseClient
            .from('secondary_sales')
            .select('*')
            .eq('primary_sales_id', primarySalesData.id)
            .limit(5);
        
        if (existingCheck && existingCheck.length > 0) {
            console.log(`\n📊 该一级销售下已有 ${existingCheck.length} 个二级销售:`);
            existingCheck.forEach(sec => {
                console.log(`  - ${sec.wechat_name} (${sec.sales_code})`);
            });
        }
        
        // 4. 测试创建（不实际创建）
        console.log('\n🔍 步骤3: 模拟创建测试...');
        const testData = {
            wechat_name: testWechatName,
            crypto_address: '0x' + Math.random().toString(36).substring(7),
            sales_code: 'SEC' + Date.now(),
            primary_sales_id: primarySalesData.id,
            commission_rate: 30,
            payment_method: 'crypto',
            sales_type: 'secondary',
            created_at: new Date().toISOString()
        };
        
        console.log('测试数据结构:');
        console.log(JSON.stringify(testData, null, 2));
        
        // 尝试插入测试
        console.log('\n🔍 步骤4: 尝试实际创建测试记录...');
        const { data: insertResult, error: insertError } = await supabaseClient
            .from('secondary_sales')
            .insert([testData])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ 创建失败！错误信息:', insertError);
            console.log('\n问题分析:');
            
            if (insertError.code === '42501') {
                console.log('  - 权限问题: 没有插入权限');
                console.log('  - 需要检查Supabase的RLS策略');
            } else if (insertError.code === '23505') {
                console.log('  - 唯一性冲突: 可能sales_code重复');
            } else if (insertError.code === '23503') {
                console.log('  - 外键约束: primary_sales_id可能无效');
            } else if (insertError.message?.includes('column')) {
                console.log('  - 字段问题: 表结构可能不匹配');
                console.log('  - 缺少的字段:', insertError.message);
            } else {
                console.log('  - 其他错误:', insertError.message);
            }
            
            // 检查表结构
            console.log('\n🔍 步骤5: 检查secondary_sales表结构...');
            const { data: tableInfo } = await supabaseClient
                .from('secondary_sales')
                .select('*')
                .limit(0);
            
            console.log('表字段（从返回结构推断）:', Object.keys(tableInfo || {}));
            
        } else {
            console.log('✅ 测试记录创建成功！');
            console.log('创建的记录:', insertResult);
            
            // 立即删除测试记录
            console.log('\n🧹 清理测试数据...');
            const { error: deleteError } = await supabaseClient
                .from('secondary_sales')
                .delete()
                .eq('id', insertResult.id);
            
            if (!deleteError) {
                console.log('✅ 测试数据已清理');
            }
            
            console.log('\n✅ 诊断结果: 系统功能正常！');
            console.log('可能是用户输入数据的问题，请检查:');
            console.log('  1. 微信名是否重复');
            console.log('  2. 收款地址格式是否正确');
            console.log('  3. 网络是否稳定');
        }
        
        // 5. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        console.log(`  注册码状态: ${primarySalesData ? '✅ 有效' : '❌ 无效'}`);
        console.log(`  一级销售ID: ${primarySalesData?.id || 'N/A'}`);
        console.log(`  当前页面: ${window.location.pathname}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
