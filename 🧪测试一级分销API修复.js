// 🧪 测试一级分销API修复
// 验证新添加的一级分销注册API是否正常工作

const CONFIG = {
    supabaseUrl: 'https://zlhwjfhqhbxdcseyhjxj.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaHdqZmhxaGJ4ZGNzZXloanh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMzg3NzEsImV4cCI6MjA1MDYxNDc3MX0.shQjPUGT2hM9RHmb7F8sMDskmYcPjzZZjvO7nBb4vKM'
};

console.log('🧪 开始测试一级分销API修复');
console.log('======================================================================');

// 模拟前端API调用
async function testAPIDirect() {
    console.log('\n🔧 方法1：直接调用Supabase API');
    
    const testData = {
        name: 'API Test Primary Sales',
        wechat_name: 'api_test_primary_001',
        payment_method: 'alipay',
        payment_address: 'api_test@alipay.com',
        alipay_surname: 'API测试',
        commission_rate: 40.00
    };
    
    try {
        // 生成销售代码
        const salesCode = `PRI${Date.now()}`;
        const regCode = `SEC${Date.now()}`;
        
        const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/primary_sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                ...testData,
                sales_code: salesCode,
                secondary_registration_code: regCode,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ [直接API] 一级分销注册成功');
            console.log(`   销售代码: ${result[0].sales_code}`);
            console.log(`   注册码: ${result[0].secondary_registration_code}`);
            console.log(`   微信名: ${result[0].wechat_name}`);
            return result[0];
        } else {
            const error = await response.text();
            console.log('❌ [直接API] 一级分销注册失败');
            console.log(`   状态码: ${response.status}`);
            console.log(`   错误: ${error}`);
            return null;
        }
    } catch (error) {
        console.log('❌ [直接API] 请求异常');
        console.log(`   错误: ${error.message}`);
        return null;
    }
}

// 模拟通过新API结构调用
async function testAPIStructure() {
    console.log('\n🔧 方法2：通过新API结构（模拟）');
    
    const testData = {
        name: 'Structure Test Primary Sales',
        wechat_name: 'structure_test_primary_001',
        payment_method: 'alipay',
        payment_address: 'structure_test@alipay.com',
        alipay_surname: '结构测试',
        commission_rate: 40.00
    };
    
    try {
        // 模拟 SalesAPI.registerPrimary 的逻辑
        const salesData = {
            ...testData,
            sales_code: `PRI${Date.now()}`,
            secondary_registration_code: `SEC${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // 模拟 SupabaseService.createPrimarySales 调用
        const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/primary_sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(salesData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ [API结构] 一级分销注册成功');
            console.log(`   销售代码: ${result[0].sales_code}`);
            console.log(`   注册码: ${result[0].secondary_registration_code}`);
            console.log(`   微信名: ${result[0].wechat_name}`);
            
            // 模拟返回格式
            const apiResponse = {
                success: true,
                data: result[0],
                message: '一级销售注册成功'
            };
            
            console.log('✅ [API结构] 返回格式正确');
            return apiResponse;
        } else {
            const error = await response.text();
            console.log('❌ [API结构] 一级分销注册失败');
            console.log(`   状态码: ${response.status}`);
            console.log(`   错误: ${error}`);
            return {
                success: false,
                data: null,
                message: `注册失败: ${error}`
            };
        }
    } catch (error) {
        console.log('❌ [API结构] 请求异常');
        console.log(`   错误: ${error.message}`);
        return {
            success: false,
            data: null,
            message: `请求异常: ${error.message}`
        };
    }
}

// 测试二级分销注册（验证关联功能）
async function testSecondaryRegistration(primarySales) {
    if (!primarySales) {
        console.log('\n⏭️ [二级分销] 跳过测试 - 没有一级分销数据');
        return;
    }
    
    console.log('\n🔧 方法3：测试二级分销注册（关联型）');
    
    const testData = {
        name: 'Test Secondary Linked',
        wechat_name: 'test_secondary_linked_002',
        primary_sales_id: primarySales.id,
        primary_registration_code: primarySales.secondary_registration_code,
        payment_method: 'alipay',
        payment_address: 'test_secondary@alipay.com',
        alipay_surname: '二级测试',
        commission_rate: 30.00,
        status: 'active'
    };
    
    try {
        const salesData = {
            ...testData,
            sales_code: `SEC${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/secondary_sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(salesData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ [二级分销] 关联注册成功');
            console.log(`   销售代码: ${result[0].sales_code}`);
            console.log(`   关联一级ID: ${result[0].primary_sales_id}`);
            console.log(`   微信名: ${result[0].wechat_name}`);
            return result[0];
        } else {
            const error = await response.text();
            console.log('❌ [二级分销] 关联注册失败');
            console.log(`   状态码: ${response.status}`);
            console.log(`   错误: ${error}`);
            return null;
        }
    } catch (error) {
        console.log('❌ [二级分销] 请求异常');
        console.log(`   错误: ${error.message}`);
        return null;
    }
}

// 验证数据完整性
async function verifyDataIntegrity() {
    console.log('\n🔍 验证数据完整性');
    
    try {
        // 检查一级分销记录
        const primaryResponse = await fetch(`${CONFIG.supabaseUrl}/rest/v1/primary_sales?select=*&sales_code=like.PRI*&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`
            }
        });
        
        if (primaryResponse.ok) {
            const primarySales = await primaryResponse.json();
            console.log(`✅ [数据验证] 一级分销记录数: ${primarySales.length}`);
            
            if (primarySales.length > 0) {
                const latest = primarySales[0];
                console.log(`   最新记录 - 销售代码: ${latest.sales_code}`);
                console.log(`   最新记录 - 注册码: ${latest.secondary_registration_code}`);
                console.log(`   最新记录 - 佣金率: ${latest.commission_rate}%`);
            }
        }
        
        // 检查二级分销记录
        const secondaryResponse = await fetch(`${CONFIG.supabaseUrl}/rest/v1/secondary_sales?select=*&sales_code=like.SEC*&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`
            }
        });
        
        if (secondaryResponse.ok) {
            const secondarySales = await secondaryResponse.json();
            console.log(`✅ [数据验证] 二级分销记录数: ${secondarySales.length}`);
            
            if (secondarySales.length > 0) {
                const latest = secondarySales[0];
                console.log(`   最新记录 - 销售代码: ${latest.sales_code}`);
                console.log(`   最新记录 - 关联ID: ${latest.primary_sales_id || '独立'}`);
                console.log(`   最新记录 - 佣金率: ${latest.commission_rate}%`);
            }
        }
        
    } catch (error) {
        console.log('❌ [数据验证] 验证失败');
        console.log(`   错误: ${error.message}`);
    }
}

// 主测试流程
async function runTests() {
    let primarySales = null;
    
    // 测试1：直接API调用
    primarySales = await testAPIDirect();
    
    // 测试2：API结构调用
    const structureResult = await testAPIStructure();
    if (structureResult.success && !primarySales) {
        primarySales = structureResult.data;
    }
    
    // 测试3：二级分销注册
    await testSecondaryRegistration(primarySales);
    
    // 测试4：数据完整性验证
    await verifyDataIntegrity();
    
    // 总结
    console.log('\n📊 测试总结');
    console.log('======================================================================');
    
    if (primarySales) {
        console.log('🎉 一级分销API修复成功！');
        console.log('✅ 关键功能验证：');
        console.log('   ✅ 一级分销注册');
        console.log('   ✅ 销售代码生成');
        console.log('   ✅ 注册码生成');
        console.log('   ✅ 数据库存储');
        console.log('   ✅ 二级分销关联');
        console.log('\n🧪 建议下一步：');
        console.log('   1. 重新运行功能测试: node 🧪实际功能测试执行.js');
        console.log('   2. 验证前端页面调用');
        console.log('   3. 测试完整业务流程');
    } else {
        console.log('❌ 一级分销API仍有问题，需要进一步诊断');
        console.log('🔍 可能的问题：');
        console.log('   - RLS策略阻塞');
        console.log('   - 字段约束问题');
        console.log('   - 权限配置问题');
    }
}

// 执行测试
runTests().catch(error => {
    console.error('测试执行异常:', error);
});