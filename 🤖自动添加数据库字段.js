#!/usr/bin/env node

/**
 * 🤖 自动添加数据库字段
 * 尝试通过API自动修复数据库表结构
 */

const chalk = require('chalk');

const CONFIG = {
    supabase: {
        url: 'https://itvmeamoqthfqtkpubdv.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
    }
};

function logStep(step, status, details = '') {
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⏳';
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'SKIP' ? 'yellow' : 'blue';
    
    console.log(chalk[statusColor](`${statusIcon} ${step}`));
    if (details) {
        console.log(chalk.gray(`   ${details}`));
    }
}

// 尝试通过RPC调用执行SQL
async function executeSQL(sql) {
    try {
        const response = await fetch(`${CONFIG.supabase.url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.supabase.key,
                'Authorization': `Bearer ${CONFIG.supabase.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql })
        });
        
        const result = await response.text();
        return {
            success: response.ok,
            status: response.status,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// 尝试创建表结构（如果表不存在）
async function createTablesIfNotExists() {
    console.log(chalk.blue('\n🏗️ 尝试创建完整表结构'));
    
    const createPrimarySalesSQL = `
        CREATE TABLE IF NOT EXISTS primary_sales (
            id SERIAL PRIMARY KEY,
            wechat_name VARCHAR(100) NOT NULL UNIQUE,
            sales_code VARCHAR(50) UNIQUE NOT NULL,
            secondary_registration_code VARCHAR(50) UNIQUE NOT NULL,
            payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
            payment_address TEXT NOT NULL,
            alipay_surname VARCHAR(50),
            chain_name VARCHAR(50),
            commission_rate DECIMAL(5,2) DEFAULT 40.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    const createSecondarySalesSQL = `
        CREATE TABLE IF NOT EXISTS secondary_sales (
            id SERIAL PRIMARY KEY,
            wechat_name VARCHAR(100) NOT NULL UNIQUE,
            sales_code VARCHAR(50) UNIQUE NOT NULL,
            primary_sales_id INTEGER,
            primary_registration_code VARCHAR(50),
            payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
            payment_address TEXT NOT NULL,
            alipay_surname VARCHAR(50),
            chain_name VARCHAR(50),
            commission_rate DECIMAL(5,2) DEFAULT 30.00,
            status VARCHAR(20) DEFAULT 'active',
            removed_by INTEGER,
            removed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    const updateOrdersSQL = `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS primary_sales_id INTEGER,
        ADD COLUMN IF NOT EXISTS secondary_sales_id INTEGER,
        ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.3000,
        ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE;
    `;
    
    // 尝试执行SQL
    logStep('创建primary_sales表', 'TESTING');
    const primaryResult = await executeSQL(createPrimarySalesSQL);
    if (primaryResult.success) {
        logStep('创建primary_sales表', 'PASS', '表结构已创建或已存在');
    } else {
        logStep('创建primary_sales表', 'FAIL', `API不支持: ${primaryResult.data}`);
    }
    
    logStep('创建secondary_sales表', 'TESTING');
    const secondaryResult = await executeSQL(createSecondarySalesSQL);
    if (secondaryResult.success) {
        logStep('创建secondary_sales表', 'PASS', '表结构已创建或已存在');
    } else {
        logStep('创建secondary_sales表', 'FAIL', `API不支持: ${secondaryResult.data}`);
    }
    
    logStep('更新orders表', 'TESTING');
    const ordersResult = await executeSQL(updateOrdersSQL);
    if (ordersResult.success) {
        logStep('更新orders表', 'PASS', '字段已添加');
    } else {
        logStep('更新orders表', 'FAIL', `API不支持: ${ordersResult.data}`);
    }
    
    return primaryResult.success && secondaryResult.success && ordersResult.success;
}

// 尝试通过插入测试数据来"强制"创建字段
async function forceCreateFieldsByInsert() {
    console.log(chalk.blue('\n🔧 尝试通过数据插入强制创建字段'));
    
    // 构造包含所有必需字段的测试数据
    const fullPrimaryData = {
        wechat_name: `force_create_${Date.now()}`,
        sales_code: `PS_FORCE_${Date.now()}`,
        secondary_registration_code: `SR_FORCE_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: '752304285@qq.com',
        alipay_surname: '梁',
        chain_name: 'TRC20',
        commission_rate: 40.00
    };
    
    logStep('测试完整字段插入', 'TESTING');
    
    try {
        const response = await fetch(`${CONFIG.supabase.url}/rest/v1/primary_sales`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.supabase.key,
                'Authorization': `Bearer ${CONFIG.supabase.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(fullPrimaryData)
        });
        
        if (response.ok) {
            const result = await response.json();
            logStep('测试完整字段插入', 'PASS', `字段已存在，创建记录ID: ${result[0]?.id}`);
            
            // 清理测试数据
            if (result[0]?.id) {
                await fetch(`${CONFIG.supabase.url}/rest/v1/primary_sales?id=eq.${result[0].id}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': CONFIG.supabase.key,
                        'Authorization': `Bearer ${CONFIG.supabase.key}`
                    }
                });
            }
            return true;
        } else {
            const error = await response.text();
            logStep('测试完整字段插入', 'FAIL', `字段缺失: ${error}`);
            return false;
        }
    } catch (error) {
        logStep('测试完整字段插入', 'FAIL', `网络错误: ${error.message}`);
        return false;
    }
}

// 创建简化表并逐步添加数据
async function createMinimalTablesAndPopulate() {
    console.log(chalk.blue('\n🚀 创建简化表结构方案'));
    
    // 先创建最小化的表
    const minimalTables = [
        {
            name: 'primary_sales_temp',
            sql: `
                DROP TABLE IF EXISTS primary_sales_temp;
                CREATE TABLE primary_sales_temp (
                    id SERIAL PRIMARY KEY,
                    wechat_name VARCHAR(100) NOT NULL UNIQUE,
                    sales_code VARCHAR(50) UNIQUE NOT NULL,
                    secondary_registration_code VARCHAR(50) UNIQUE NOT NULL,
                    payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
                    payment_address TEXT NOT NULL,
                    alipay_surname VARCHAR(50),
                    chain_name VARCHAR(50),
                    commission_rate DECIMAL(5,2) DEFAULT 40.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `
        }
    ];
    
    for (const table of minimalTables) {
        logStep(`创建${table.name}`, 'TESTING');
        
        // 由于API限制，我们无法直接执行DDL，只能提供解决方案
        logStep(`创建${table.name}`, 'SKIP', 'REST API不支持DDL操作');
    }
    
    return false;
}

// 提供自动化解决方案
function provideAutomationSolution() {
    console.log(chalk.blue('\n🤖 自动化解决方案'));
    
    console.log(chalk.yellow('💡 由于Supabase REST API的限制，我无法直接执行ALTER TABLE操作'));
    console.log(chalk.yellow('但我可以为你提供几种自动化方案：'));
    
    console.log(chalk.white('\n🔧 方案1：Supabase CLI自动执行'));
    console.log(chalk.gray('1. 安装Supabase CLI: npm install -g supabase'));
    console.log(chalk.gray('2. 登录: supabase login'));
    console.log(chalk.gray('3. 执行SQL: supabase db sql --file 🔧添加缺失数据库字段.sql'));
    
    console.log(chalk.white('\n🌐 方案2：直接Web执行（最简单）'));
    console.log(chalk.gray('1. 打开: https://supabase.com/dashboard/project/itvmeamoqthfqtkpubdv/sql'));
    console.log(chalk.gray('2. 粘贴下面的快速SQL'));
    console.log(chalk.gray('3. 点击Run执行'));
    
    console.log(chalk.blue('\n⚡ 快速执行SQL（复制粘贴即可）:'));
    console.log(chalk.green(`
-- 一键修复所有字段
ALTER TABLE primary_sales 
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS secondary_registration_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40.00;

ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 30.00;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.3000,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- 为现有记录生成销售代码（如果有）
UPDATE primary_sales 
SET sales_code = 'PS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    secondary_registration_code = 'SR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))
WHERE sales_code IS NULL;

UPDATE secondary_sales 
SET sales_code = 'SS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))
WHERE sales_code IS NULL;
`));
    
    console.log(chalk.blue('\n🔗 直接访问链接:'));
    console.log(chalk.yellow('https://supabase.com/dashboard/project/itvmeamoqthfqtkpubdv/sql'));
    
    console.log(chalk.white('\n📋 执行步骤:'));
    console.log(chalk.white('1. 点击上面的链接（会直接打开SQL编辑器）'));
    console.log(chalk.white('2. 清空编辑器内容'));
    console.log(chalk.white('3. 复制上面绿色的SQL代码'));
    console.log(chalk.white('4. 粘贴到编辑器'));
    console.log(chalk.white('5. 点击"Run"按钮'));
    console.log(chalk.white('6. 等待执行完成'));
    
    console.log(chalk.green('\n⏱️  预计执行时间: 10-30秒'));
    console.log(chalk.green('✅ 执行成功后会看到: "Success. No rows returned"'));
}

// 执行验证
async function runPostFixVerification() {
    console.log(chalk.blue('\n🧪 执行修复后验证'));
    
    const testData = {
        wechat_name: `test_verify_${Date.now()}`,
        sales_code: `PS_VERIFY_${Date.now()}`,
        secondary_registration_code: `SR_VERIFY_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: '752304285@qq.com',
        alipay_surname: '梁',
        commission_rate: 40.00
    };
    
    logStep('验证修复效果', 'TESTING');
    
    try {
        const response = await fetch(`${CONFIG.supabase.url}/rest/v1/primary_sales`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.supabase.key,
                'Authorization': `Bearer ${CONFIG.supabase.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok) {
            const result = await response.json();
            logStep('验证修复效果', 'PASS', `✅ 数据库字段修复成功！记录ID: ${result[0]?.id}`);
            
            // 清理测试数据
            if (result[0]?.id) {
                await fetch(`${CONFIG.supabase.url}/rest/v1/primary_sales?id=eq.${result[0].id}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': CONFIG.supabase.key,
                        'Authorization': `Bearer ${CONFIG.supabase.key}`
                    }
                });
                logStep('清理测试数据', 'PASS', `删除测试记录 ID: ${result[0].id}`);
            }
            
            console.log(chalk.green('\n🎉 恭喜！数据库修复成功'));
            console.log(chalk.yellow('🚀 现在可以运行完整功能测试了：'));
            console.log(chalk.white('   node 🧪实际功能测试执行.js'));
            
            return true;
        } else {
            const error = await response.text();
            logStep('验证修复效果', 'FAIL', `仍有问题: ${error}`);
            
            console.log(chalk.red('\n❌ 数据库字段仍未修复'));
            console.log(chalk.yellow('💡 请按照上面的方案2在Web界面执行SQL'));
            
            return false;
        }
    } catch (error) {
        logStep('验证修复效果', 'FAIL', `网络错误: ${error.message}`);
        return false;
    }
}

// 主函数
async function runAutoFix() {
    console.log(chalk.blue('🤖 开始自动添加数据库字段'));
    console.log(chalk.gray('=' * 60));
    
    // 先检查当前状态
    logStep('检查当前字段状态', 'TESTING');
    const isAlreadyFixed = await forceCreateFieldsByInsert();
    
    if (isAlreadyFixed) {
        console.log(chalk.green('\n🎉 太好了！数据库字段已经完整'));
        console.log(chalk.yellow('🚀 可以直接运行功能测试了'));
        return;
    }
    
    // 尝试自动修复
    console.log(chalk.yellow('\n⚠️  检测到字段缺失，尝试自动修复...'));
    
    // 尝试不同的修复方法
    const methods = [
        { name: '通过RPC执行SQL', func: createTablesIfNotExists },
        { name: '创建简化表结构', func: createMinimalTablesAndPopulate }
    ];
    
    let autoFixSuccess = false;
    for (const method of methods) {
        logStep(`尝试${method.name}`, 'TESTING');
        try {
            const result = await method.func();
            if (result) {
                logStep(`尝试${method.name}`, 'PASS');
                autoFixSuccess = true;
                break;
            } else {
                logStep(`尝试${method.name}`, 'FAIL', 'API限制无法执行');
            }
        } catch (error) {
            logStep(`尝试${method.name}`, 'FAIL', error.message);
        }
    }
    
    if (!autoFixSuccess) {
        console.log(chalk.yellow('\n📋 自动修复受限，提供手动解决方案：'));
        provideAutomationSolution();
        
        console.log(chalk.blue('\n⏳ 执行SQL后，运行验证：'));
        console.log(chalk.white('   node 🤖自动添加数据库字段.js --verify'));
    }
    
    // 如果有--verify参数，执行验证
    if (process.argv.includes('--verify')) {
        await runPostFixVerification();
    }
}

// 执行自动修复
if (require.main === module) {
    runAutoFix();
}

module.exports = {
    runAutoFix,
    runPostFixVerification,
    provideAutomationSolution
};