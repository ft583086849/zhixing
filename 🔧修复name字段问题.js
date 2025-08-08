// 🔧 修复secondary_sales表name字段问题
// 请在 https://zhixing-seven.vercel.app/ 任意页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔧 修复secondary_sales表name字段问题...');
    console.log('='.repeat(60));
    
    try {
        const supabase = window.supabaseClient || window.supabase;
        if (!supabase) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 1. 检查表结构
        console.log('\n🔍 步骤1: 检查secondary_sales表结构...');
        const { data: sample, error: sampleError } = await supabase
            .from('secondary_sales')
            .select('*')
            .limit(1);
        
        if (sample && sample.length > 0) {
            console.log('表中现有字段:', Object.keys(sample[0]));
        } else if (sampleError && sampleError.code !== 'PGRST116') {
            console.error('查询失败:', sampleError);
        } else {
            console.log('表为空，尝试获取表结构...');
        }
        
        // 2. 测试两种字段名
        console.log('\n🔍 步骤2: 测试字段兼容性...');
        const timestamp = Date.now().toString().slice(-6);
        
        // 测试1: 只使用name字段
        console.log('\n测试1: 使用name字段');
        const testData1 = {
            name: 'test_name_' + timestamp,
            crypto_address: '0x' + timestamp,
            sales_code: 'SEC' + timestamp + '1',
            commission_rate: 30
        };
        
        const { data: result1, error: error1 } = await supabase
            .from('secondary_sales')
            .insert([testData1])
            .select()
            .single();
        
        if (error1) {
            console.error('❌ 使用name字段失败:', error1.message);
        } else {
            console.log('✅ 使用name字段成功');
            // 清理测试数据
            await supabase.from('secondary_sales').delete().eq('id', result1.id);
        }
        
        // 测试2: 只使用wechat_name字段
        console.log('\n测试2: 使用wechat_name字段');
        const testData2 = {
            wechat_name: 'test_wechat_' + timestamp,
            crypto_address: '0x' + timestamp,
            sales_code: 'SEC' + timestamp + '2',
            commission_rate: 30
        };
        
        const { data: result2, error: error2 } = await supabase
            .from('secondary_sales')
            .insert([testData2])
            .select()
            .single();
        
        if (error2) {
            console.error('❌ 使用wechat_name字段失败:', error2.message);
            
            // 如果失败了，尝试同时提供两个字段
            console.log('\n测试3: 同时提供name和wechat_name');
            const testData3 = {
                name: 'test_both_' + timestamp,
                wechat_name: 'test_both_' + timestamp,
                crypto_address: '0x' + timestamp,
                sales_code: 'SEC' + timestamp + '3',
                commission_rate: 30
            };
            
            const { data: result3, error: error3 } = await supabase
                .from('secondary_sales')
                .insert([testData3])
                .select()
                .single();
            
            if (error3) {
                console.error('❌ 同时提供两个字段也失败:', error3.message);
            } else {
                console.log('✅ 同时提供两个字段成功');
                await supabase.from('secondary_sales').delete().eq('id', result3.id);
            }
        } else {
            console.log('✅ 使用wechat_name字段成功');
            await supabase.from('secondary_sales').delete().eq('id', result2.id);
        }
        
        // 3. 提供解决方案
        console.log('\n' + '='.repeat(60));
        console.log('💡 解决方案:');
        console.log('='.repeat(60));
        
        console.log('\n方案1: 修改表结构（在Supabase SQL Editor中执行）');
        const sql1 = `
-- 方案1: 将name字段改为可空
ALTER TABLE secondary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 或者方案2: 添加wechat_name字段（如果不存在）
ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS wechat_name VARCHAR(255);

-- 或者方案3: 重命名字段
ALTER TABLE secondary_sales 
RENAME COLUMN name TO wechat_name;`;
        console.log(sql1);
        
        console.log('\n方案2: 修改前端代码（临时解决）');
        const code = `
// 在创建时同时提供name和wechat_name
const salesData = {
    name: formData.wechat_name,  // 添加name字段
    wechat_name: formData.wechat_name,  // 保留wechat_name
    crypto_address: formData.crypto_address,
    sales_code: 'SEC' + Date.now(),
    commission_rate: 30
};`;
        console.log(code);
        
        console.log('\n方案3: 立即创建二级销售（使用正确的字段）');
        console.log(`
// 复制以下代码直接创建
(async () => {
    const supabase = window.supabaseClient || window.supabase;
    const timestamp = Date.now().toString().slice(-6);
    
    const { data, error } = await supabase
        .from('secondary_sales')
        .insert([{
            name: '您的微信名',  // 使用name字段
            crypto_address: '您的钱包地址',
            sales_code: 'SEC' + timestamp,
            commission_rate: 30
        }])
        .select()
        .single();
    
    if (error) {
        console.error('失败:', error);
    } else {
        console.log('✅ 创建成功！');
        console.log('购买链接:', location.origin + '/purchase?sales_code=' + data.sales_code);
    }
})();`);
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
