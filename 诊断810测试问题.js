// 诊断810测试的二级销售关联问题
// 在任意页面控制台运行

(async function() {
    console.log('🔍 诊断810测试的二级销售关联问题...\n');
    
    // 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        // 尝试动态加载
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        } else {
            console.error('❌ 无法创建 Supabase 客户端');
            return;
        }
    }
    
    console.log('1️⃣ 查询810测试的一级销售信息...');
    
    // 查询一级销售
    const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .ilike('wechat_name', '%810测试%');
    
    if (primaryError) {
        console.error('❌ 查询一级销售失败:', primaryError);
        return;
    }
    
    if (!primarySales || primarySales.length === 0) {
        console.log('❌ 未找到810测试的一级销售');
        
        // 尝试模糊查询
        console.log('\n尝试查询包含810的所有一级销售...');
        const { data: fuzzyPrimary } = await supabase
            .from('primary_sales')
            .select('id, wechat_name, sales_code')
            .ilike('wechat_name', '%810%');
        
        if (fuzzyPrimary && fuzzyPrimary.length > 0) {
            console.log('找到相似的一级销售:');
            fuzzyPrimary.forEach(p => {
                console.log(`  - ${p.wechat_name} (ID: ${p.id}, Code: ${p.sales_code})`);
            });
        }
        return;
    }
    
    console.log('✅ 找到一级销售:');
    primarySales.forEach(p => {
        console.log(`  微信号: ${p.wechat_name}`);
        console.log(`  ID: ${p.id}`);
        console.log(`  销售代码: ${p.sales_code}`);
        console.log(`  二级注册码: ${p.secondary_registration_code}`);
        console.log('');
    });
    
    // 使用找到的第一个一级销售
    const primary = primarySales[0];
    
    console.log('\n2️⃣ 查询关联的二级销售...');
    
    // 方法1: 通过primary_sales_id查询
    const { data: secondaryByPrimaryId, error: error1 } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primary.id);
    
    console.log('\n方法1 - 通过primary_sales_id查询:');
    if (error1) {
        console.error('❌ 查询失败:', error1);
    } else {
        console.log(`找到 ${secondaryByPrimaryId?.length || 0} 个二级销售`);
        if (secondaryByPrimaryId && secondaryByPrimaryId.length > 0) {
            secondaryByPrimaryId.forEach(s => {
                console.log(`  - ${s.wechat_name} (ID: ${s.id}, primary_sales_id: ${s.primary_sales_id})`);
            });
        }
    }
    
    // 方法2: 通过registration_code查询
    if (primary.secondary_registration_code) {
        const { data: secondaryByCode, error: error2 } = await supabase
            .from('secondary_sales')
            .select('*')
            .eq('registration_code', primary.secondary_registration_code);
        
        console.log('\n方法2 - 通过registration_code查询:');
        if (error2) {
            console.error('❌ 查询失败:', error2);
        } else {
            console.log(`找到 ${secondaryByCode?.length || 0} 个二级销售`);
            if (secondaryByCode && secondaryByCode.length > 0) {
                secondaryByCode.forEach(s => {
                    console.log(`  - ${s.wechat_name} (ID: ${s.id}, registration_code: ${s.registration_code})`);
                });
            }
        }
    }
    
    // 方法3: 查询所有二级销售，检查是否有关联
    console.log('\n3️⃣ 查询所有二级销售，寻找可能的关联...');
    
    const { data: allSecondary, error: error3 } = await supabase
        .from('secondary_sales')
        .select('id, wechat_name, primary_sales_id, registration_code, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (!error3 && allSecondary) {
        console.log(`\n最近的20个二级销售:`);
        
        // 查找可能与810测试相关的
        const related = allSecondary.filter(s => 
            s.wechat_name?.includes('810') || 
            s.wechat_name?.includes('二级') ||
            s.primary_sales_id === primary.id
        );
        
        if (related.length > 0) {
            console.log('\n可能相关的二级销售:');
            related.forEach(s => {
                console.log(`  微信号: ${s.wechat_name}`);
                console.log(`  ID: ${s.id}`);
                console.log(`  primary_sales_id: ${s.primary_sales_id || '❌ 未设置'}`);
                console.log(`  registration_code: ${s.registration_code || '❌ 未设置'}`);
                console.log(`  创建时间: ${s.created_at}`);
                console.log('  ---');
            });
        } else {
            console.log('未找到明显相关的二级销售');
        }
    }
    
    // 诊断结果
    console.log('\n📊 诊断结果:');
    
    if (!secondaryByPrimaryId || secondaryByPrimaryId.length === 0) {
        console.log('\n❌ 问题原因:');
        console.log('二级销售的 primary_sales_id 字段未正确设置');
        
        console.log('\n🔧 修复方案:');
        console.log('1. 找到属于810测试的二级销售');
        console.log('2. 更新他们的 primary_sales_id 字段');
        
        // 提供修复SQL
        console.log('\n📝 修复SQL示例:');
        console.log(`
-- 更新特定二级销售的关联
UPDATE secondary_sales 
SET primary_sales_id = ${primary.id}
WHERE wechat_name LIKE '%810%的二级%'
   OR wechat_name = '810测试的二级';

-- 或者通过registration_code关联
UPDATE secondary_sales 
SET primary_sales_id = ${primary.id}
WHERE registration_code = '${primary.secondary_registration_code}';
        `);
        
        // 提供JavaScript修复代码
        console.log('\n💻 或使用JavaScript修复:');
        console.log(`
// 修复特定二级销售
const secondaryName = prompt('输入二级销售微信号:');
if (secondaryName) {
    await supabase
        .from('secondary_sales')
        .update({ primary_sales_id: ${primary.id} })
        .eq('wechat_name', secondaryName);
}
        `);
    } else {
        console.log('\n✅ 关联正常');
        console.log(`810测试下有 ${secondaryByPrimaryId.length} 个二级销售`);
    }
    
    // API调用测试
    console.log('\n4️⃣ 测试API调用...');
    console.log('在一级销售对账页面，API通过以下方式查询:');
    console.log('1. 根据微信号查找一级销售');
    console.log('2. 使用primary_sales_id查找关联的二级销售');
    console.log('3. 如果primary_sales_id未设置，则找不到二级销售');
    
    return {
        primary,
        secondaryCount: secondaryByPrimaryId?.length || 0,
        secondaryList: secondaryByPrimaryId || []
    };
})();
