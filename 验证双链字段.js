// 在浏览器控制台运行此脚本，验证字段添加是否成功
// 需要先登录到应用

(async function() {
    console.log('🔍 验证双链字段是否添加成功...\n');
    
    // 1. 清除缓存
    console.log('1️⃣ 清除缓存...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ 缓存已清除\n');
    
    // 2. 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 3. 获取表结构信息
    console.log('2️⃣ 检查表结构...');
    
    try {
        // 尝试获取配置，看看字段是否存在
        const { data: config, error } = await supabase
            .from('payment_config')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();
        
        if (error) {
            console.error('❌ 获取配置失败:', error);
            return;
        }
        
        console.log('3️⃣ 检查字段状态:\n');
        console.log('====================');
        
        // 检查必要字段
        const requiredFields = [
            'crypto2_chain_name',
            'crypto2_address', 
            'crypto2_qr_code'
        ];
        
        let allFieldsExist = true;
        
        requiredFields.forEach(field => {
            const exists = field in config;
            const value = config[field];
            
            console.log(`${exists ? '✅' : '❌'} ${field}:`);
            console.log(`   存在: ${exists ? '是' : '否'}`);
            console.log(`   值: ${value || '(空)'}`);
            console.log('');
            
            if (!exists) {
                allFieldsExist = false;
            }
        });
        
        console.log('====================\n');
        
        if (allFieldsExist) {
            console.log('✅ 所有字段都已成功添加！');
            
            // 4. 如果字段存在但值为空，设置默认值
            if (!config.crypto2_chain_name || !config.crypto2_address) {
                console.log('\n4️⃣ 设置默认值...');
                
                const { data: updated, error: updateError } = await supabase
                    .from('payment_config')
                    .update({
                        crypto2_chain_name: config.crypto2_chain_name || 'BSC',
                        crypto2_address: config.crypto2_address || '0xAE25E29d3baCD91B0fFd0807859531419a85375a'
                    })
                    .eq('id', config.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('❌ 设置默认值失败:', updateError);
                } else {
                    console.log('✅ 默认值已设置:');
                    console.log('   链名: BSC');
                    console.log('   地址: 0xAE25E29d3baCD91B0fFd0807859531419a85375a');
                }
            }
            
            console.log('\n✨ 下一步:');
            console.log('1. 访问管理后台: /admin/payment-config');
            console.log('2. 上传第二个链的收款二维码');
            console.log('3. 保存配置');
            console.log('4. 访问购买页面查看双链显示');
            
        } else {
            console.log('❌ 部分字段缺失，请添加字段');
            console.log('\n📝 请在 Supabase 控制台执行 SQL:');
            console.log('1. 登录 https://app.supabase.com');
            console.log('2. 选择你的项目');
            console.log('3. 点击左侧 SQL Editor');
            console.log('4. 运行 添加双链字段SQL.sql 中的命令');
        }
        
    } catch (err) {
        console.error('❌ 发生错误:', err);
    }
})();
