#!/usr/bin/env node

/**
 * 🛠️ 综合问题诊断和修复
 * 解决管理员跳转、购买页面和销售注册问题
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAndFix() {
    console.log('🛠️ 开始综合问题诊断和修复...');
    
    try {
        // 1. 测试管理员登录
        console.log('\n👤 1. 测试管理员登录');
        await testAdminLogin();
        
        // 2. 测试销售代码查询
        console.log('\n🔍 2. 测试销售代码查询');
        await testSalesCodeQuery();
        
        // 3. 测试销售注册功能
        console.log('\n📝 3. 测试销售注册功能');
        await testSalesRegistration();
        
        // 4. 检查数据库表结构
        console.log('\n🗄️ 4. 检查数据库表结构');
        await checkDatabaseStructure();
        
        console.log('\n🎯 诊断结果和修复建议');
        
    } catch (error) {
        console.error('❌ 诊断失败:', error.message);
    }
}

// 1. 测试管理员登录
async function testAdminLogin() {
    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', 'admin')
            .single();
        
        if (error) {
            console.log('   ❌ 管理员查询失败:', error.message);
            return;
        }
        
        console.log('   ✅ 管理员账户存在:', admin.username);
        
        // 验证密码
        if (admin.password_hash === 'admin123') {
            console.log('   ✅ 密码验证正确');
        } else {
            console.log('   ❌ 密码不匹配, 当前:', admin.password_hash);
        }
        
    } catch (error) {
        console.log('   ❌ 管理员登录测试失败:', error.message);
    }
}

// 2. 测试销售代码查询
async function testSalesCodeQuery() {
    const testCodes = ['TEST001', 'TEST002', 'SEC001'];
    
    for (const code of testCodes) {
        try {
            // 查询一级销售
            const { data: primarySale, error: primaryError } = await supabase
                .from('primary_sales')
                .select('*')
                .eq('sales_code', code)
                .single();
            
            if (!primaryError) {
                console.log(`   ✅ 一级销售 ${code} 存在:`, primarySale.name);
                continue;
            }
            
            // 查询二级销售
            const { data: secondarySale, error: secondaryError } = await supabase
                .from('secondary_sales')
                .select('*')
                .eq('sales_code', code)
                .single();
            
            if (!secondaryError) {
                console.log(`   ✅ 二级销售 ${code} 存在:`, secondarySale.name);
            } else {
                console.log(`   ❌ 销售代码 ${code} 不存在`);
            }
            
        } catch (error) {
            console.log(`   ❌ 查询 ${code} 失败:`, error.message);
        }
    }
}

// 3. 测试销售注册功能
async function testSalesRegistration() {
    try {
        // 测试创建一级销售
        const testPrimarySales = {
            sales_code: 'DIAG001',
            name: '诊断测试销售',
            phone: '13900000000',
            email: 'diag@test.com',
            commission_rate: 0.4000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: newPrimary, error: primaryError } = await supabase
            .from('primary_sales')
            .insert([testPrimarySales])
            .select()
            .single();
        
        if (primaryError) {
            console.log('   ❌ 一级销售创建失败:', primaryError.message);
            console.log('   📋 错误详情:', primaryError);
        } else {
            console.log('   ✅ 一级销售创建成功:', newPrimary.sales_code);
            
            // 清理测试数据
            await supabase
                .from('primary_sales')
                .delete()
                .eq('sales_code', 'DIAG001');
        }
        
    } catch (error) {
        console.log('   ❌ 销售注册测试失败:', error.message);
    }
}

// 4. 检查数据库表结构
async function checkDatabaseStructure() {
    const tables = ['admins', 'primary_sales', 'secondary_sales', 'orders'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`   ❌ 表 ${table} 查询失败:`, error.message);
                if (error.code === '42P01') {
                    console.log(`   💡 表 ${table} 不存在，需要创建`);
                }
            } else {
                console.log(`   ✅ 表 ${table} 正常`);
            }
            
        } catch (error) {
            console.log(`   ❌ 检查表 ${table} 失败:`, error.message);
        }
    }
}

// 运行诊断
diagnoseAndFix().catch(console.error);