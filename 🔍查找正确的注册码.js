// 🔍 查找正确的注册码
// 请在 https://zhixing-seven.vercel.app/ 任意页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 查找正确的注册码...');
    console.log('='.repeat(60));
    
    const targetCode = 'SEC17546258397274661';
    console.log(`\n🎯 目标代码: ${targetCode}`);
    
    try {
        // 获取Supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 1. 在primary_sales表中查找
        console.log('\n📋 在primary_sales表中查找...');
        const { data: primarySales } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .or(`sales_code.eq.${targetCode},secondary_registration_code.eq.${targetCode}`);
        
        if (primarySales && primarySales.length > 0) {
            console.log('✅ 在primary_sales表中找到记录:');
            primarySales.forEach(sale => {
                console.log('\n一级销售信息:');
                console.log(`  - ID: ${sale.id}`);
                console.log(`  - 微信名: ${sale.wechat_name}`);
                console.log(`  - 销售码: ${sale.sales_code}`);
                console.log(`  - 二级注册码: ${sale.secondary_registration_code || '未设置'}`);
                
                if (sale.sales_code === targetCode) {
                    console.log('\n⚠️ 注意: 这是一个一级销售的销售码（用于用户购买）');
                    if (sale.secondary_registration_code) {
                        console.log(`✅ 正确的二级销售注册链接应该是:`);
                        console.log(`   https://zhixing-seven.vercel.app/secondary-sales?registration_code=${sale.secondary_registration_code}`);
                    } else {
                        console.log('❌ 该一级销售还没有生成二级注册码');
                    }
                }
                
                if (sale.secondary_registration_code === targetCode) {
                    console.log('\n✅ 这是一个有效的二级销售注册码');
                }
            });
        }
        
        // 2. 在secondary_sales表中查找
        console.log('\n📋 在secondary_sales表中查找...');
        const { data: secondarySales } = await supabaseClient
            .from('secondary_sales')
            .select('*')
            .eq('sales_code', targetCode);
        
        if (secondarySales && secondarySales.length > 0) {
            console.log('✅ 在secondary_sales表中找到记录:');
            secondarySales.forEach(sale => {
                console.log('\n二级销售信息:');
                console.log(`  - ID: ${sale.id}`);
                console.log(`  - 微信名: ${sale.wechat_name}`);
                console.log(`  - 销售码: ${sale.sales_code}`);
                console.log(`  - 关联一级ID: ${sale.primary_sales_id || '独立注册'}`);
                
                console.log('\n⚠️ 注意: 这是一个二级销售的销售码');
                console.log('二级销售不能再创建下级销售，只能用于用户购买');
                console.log(`用户购买链接: https://zhixing-seven.vercel.app/purchase?sales_code=${sale.sales_code}`);
            });
        }
        
        // 3. 查找所有可用的注册码
        console.log('\n📋 查找所有可用的二级销售注册码...');
        const { data: allPrimarySales } = await supabaseClient
            .from('primary_sales')
            .select('wechat_name, sales_code, secondary_registration_code')
            .not('secondary_registration_code', 'is', null)
            .limit(5);
        
        if (allPrimarySales && allPrimarySales.length > 0) {
            console.log('\n可用的二级销售注册链接:');
            allPrimarySales.forEach(sale => {
                console.log(`\n${sale.wechat_name}:`);
                console.log(`  注册码: ${sale.secondary_registration_code}`);
                console.log(`  注册链接: https://zhixing-seven.vercel.app/secondary-sales?registration_code=${sale.secondary_registration_code}`);
            });
        }
        
        // 4. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        
        if (!primarySales && !secondarySales) {
            console.log(`❌ 代码 ${targetCode} 在系统中不存在`);
        } else {
            console.log('✅ 找到相关记录，请查看上面的详细信息');
        }
        
        console.log('\n💡 提示:');
        console.log('  - 销售码（以PRI/SEC开头）: 用于用户购买');
        console.log('  - 注册码（特殊格式）: 用于二级销售注册');
        console.log('  - 只有一级销售可以有二级注册码');
        console.log('  - 二级销售不能再创建下级');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('查找过程出错:', error);
    }
})();
