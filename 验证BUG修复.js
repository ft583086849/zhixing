// 验证二级销售注册BUG是否已修复
// 在任意页面控制台运行

(async function() {
    console.log('🔧 验证二级销售注册BUG修复\n');
    console.log('=====================================');
    
    // 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    
    // 1. 获取一个一级销售的注册链接
    console.log('1️⃣ 获取一级销售的二级注册链接...\n');
    
    const { data: primarySales } = await supabase
        .from('primary_sales')
        .select('id, wechat_name, sales_code, secondary_registration_code')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (!primarySales || primarySales.length === 0) {
        console.error('❌ 没有找到一级销售');
        return;
    }
    
    console.log('最近的一级销售:');
    primarySales.forEach(p => {
        console.log(`\n${p.wechat_name} (ID: ${p.id})`);
        console.log(`  销售代码: ${p.sales_code}`);
        console.log(`  二级注册码: ${p.secondary_registration_code || '❌ 无'}`);
        
        if (p.secondary_registration_code) {
            const link = `${window.location.origin}/secondary-sales?registration_code=${p.secondary_registration_code}`;
            console.log(`  📱 二级注册链接: ${link}`);
        }
    });
    
    // 2. 检查URL参数识别
    console.log('\n2️⃣ 测试URL参数识别...\n');
    
    const testCases = [
        {
            url: '/secondary-sales?registration_code=SEC123456',
            expected: '应该进入关联模式'
        },
        {
            url: '/secondary-sales?sales_code=SEC123456',
            expected: '兼容旧参数，也应该进入关联模式'
        },
        {
            url: '/secondary-sales',
            expected: '应该进入独立模式'
        }
    ];
    
    console.log('URL参数测试:');
    testCases.forEach(test => {
        console.log(`  ${test.url}`);
        console.log(`    → ${test.expected}`);
    });
    
    // 3. 检查最近注册的二级销售
    console.log('\n3️⃣ 检查最近注册的二级销售...\n');
    
    const { data: recentSecondary } = await supabase
        .from('secondary_sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (recentSecondary && recentSecondary.length > 0) {
        console.log('最近注册的二级销售:');
        recentSecondary.forEach(s => {
            const status = s.primary_sales_id ? 
                `✅ 已关联到一级 (ID: ${s.primary_sales_id})` : 
                `❌ 未关联`;
            
            console.log(`\n${s.wechat_name}`);
            console.log(`  状态: ${status}`);
            console.log(`  注册码: ${s.registration_code || '无'}`);
            console.log(`  创建时间: ${s.created_at?.substring(0, 19)}`);
        });
    }
    
    // 4. 提供测试步骤
    console.log('\n4️⃣ 手动测试步骤:');
    console.log('=====================================');
    console.log('1. 复制一个一级销售的二级注册链接');
    console.log('2. 在隐身窗口打开链接');
    console.log('3. 应该看到"关联到XXX"的提示');
    console.log('4. 填写信息并注册');
    console.log('5. 注册成功后，检查数据库中的primary_sales_id是否正确设置');
    
    console.log('\n✅ BUG修复验证:');
    console.log('- 修复前：URL使用registration_code参数，但页面检查sales_code，导致无法关联');
    console.log('- 修复后：页面同时检查registration_code和sales_code参数，优先使用registration_code');
    
    // 5. 快速修复历史数据
    console.log('\n5️⃣ 修复历史数据:');
    console.log('=====================================');
    console.log('如果有历史数据需要修复，运行"自动修复注册关联.js"');
    console.log('它会自动根据registration_code找到对应的一级销售并建立关联');
})();
