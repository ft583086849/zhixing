#!/usr/bin/env node

/**
 * 🔍 检查表实际结构
 * 详细检查当前数据库表的实际情况
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

// Supabase API 调用
async function supabaseCall(endpoint, method = 'GET', data = null) {
    const url = `${CONFIG.supabase.url}/rest/v1/${endpoint}`;
    
    const headers = {
        'apikey': CONFIG.supabase.key,
        'Authorization': `Bearer ${CONFIG.supabase.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    const options = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const responseData = await response.text();
        
        let parsedData = null;
        try {
            parsedData = responseData ? JSON.parse(responseData) : null;
        } catch (e) {
            parsedData = responseData;
        }
        
        return {
            success: response.ok,
            status: response.status,
            data: parsedData,
            rawData: responseData,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message,
            data: null
        };
    }
}

// 检查表是否存在
async function checkTableExists(tableName) {
    logStep(`检查${tableName}表是否存在`, 'TESTING');
    
    const result = await supabaseCall(`${tableName}?select=*&limit=1`);
    
    if (result.success) {
        logStep(`检查${tableName}表是否存在`, 'PASS', `表存在，状态码: ${result.status}`);
        return true;
    } else {
        logStep(`检查${tableName}表是否存在`, 'FAIL', `表不存在或无权限: ${result.status}`);
        console.log(chalk.gray(`   错误详情: ${result.rawData}`));
        return false;
    }
}

// 检查表字段（通过简单插入测试）
async function checkTableFields(tableName) {
    logStep(`检查${tableName}表字段`, 'TESTING');
    
    // 根据不同表测试不同的基础字段组合
    let testFields = {};
    
    if (tableName === 'primary_sales') {
        // 测试primary_sales的基础字段
        testFields = {
            wechat_name: `test_field_check_${Date.now()}`,
        };
    } else if (tableName === 'secondary_sales') {
        // 测试secondary_sales的基础字段
        testFields = {
            wechat_name: `test_field_check_${Date.now()}`,
        };
    } else if (tableName === 'orders') {
        // 测试orders的基础字段
        testFields = {
            tradingview_username: `test_field_check_${Date.now()}`,
        };
    } else if (tableName === 'admins') {
        // 测试admins的基础字段
        testFields = {
            username: `test_field_check_${Date.now()}`,
            password_hash: 'test123'
        };
    }
    
    const result = await supabaseCall(tableName, 'POST', testFields);
    
    if (result.success) {
        logStep(`检查${tableName}表字段`, 'PASS', `基础字段可用`);
        
        // 清理测试数据
        if (result.data && result.data[0]?.id) {
            await supabaseCall(`${tableName}?id=eq.${result.data[0].id}`, 'DELETE');
            console.log(chalk.gray(`   已清理测试数据 ID: ${result.data[0].id}`));
        }
        return { success: true, fields: Object.keys(testFields) };
    } else {
        logStep(`检查${tableName}表字段`, 'FAIL', `字段问题`);
        console.log(chalk.red(`   错误详情: ${result.rawData}`));
        
        // 分析错误信息，提取缺失的字段
        const errorMsg = result.rawData;
        const missingFieldMatch = errorMsg.match(/Could not find the '([^']+)' column/);
        if (missingFieldMatch) {
            const missingField = missingFieldMatch[1];
            console.log(chalk.yellow(`   缺失字段: ${missingField}`));
            return { success: false, missingField };
        }
        
        return { success: false, error: errorMsg };
    }
}

// 生成修复建议
function generateRepairSQL(tableName, missingFields) {
    console.log(chalk.blue(`\n🔧 ${tableName}表修复SQL:`));
    
    const fieldDefinitions = {
        // primary_sales 字段定义
        wechat_name: 'VARCHAR(100) NOT NULL UNIQUE',
        payment_method: 'VARCHAR(20) NOT NULL DEFAULT \'alipay\'',
        payment_address: 'TEXT',
        alipay_surname: 'VARCHAR(50)',
        chain_name: 'VARCHAR(50)',
        sales_code: 'VARCHAR(50) UNIQUE',
        secondary_registration_code: 'VARCHAR(50) UNIQUE',
        commission_rate: 'DECIMAL(5,2) DEFAULT 40.00',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        
        // secondary_sales 字段定义
        primary_sales_id: 'INTEGER',
        primary_registration_code: 'VARCHAR(50)',
        status: 'VARCHAR(20) DEFAULT \'active\'',
        
        // orders 字段定义
        tradingview_username: 'VARCHAR(100) NOT NULL',
        duration: 'VARCHAR(20)',
        amount: 'DECIMAL(10,2)',
        sales_type: 'VARCHAR(20)',
        config_confirmed: 'BOOLEAN DEFAULT FALSE',
        
        // admins 字段定义
        username: 'VARCHAR(50) UNIQUE NOT NULL',
        password_hash: 'VARCHAR(255) NOT NULL'
    };
    
    console.log(chalk.green(`-- 修复 ${tableName} 表`));
    missingFields.forEach(field => {
        const definition = fieldDefinitions[field] || 'TEXT';
        console.log(chalk.white(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${field} ${definition};`));
    });
}

// 主检查函数
async function runTableStructureCheck() {
    console.log(chalk.blue('🔍 开始检查表实际结构'));
    console.log(chalk.gray('=' * 60));
    
    const tables = [
        'admins',
        'primary_sales', 
        'secondary_sales',
        'orders'
    ];
    
    const tableStatus = {};
    const allMissingFields = {};
    
    for (const table of tables) {
        console.log(chalk.yellow(`\n📋 检查 ${table} 表:`));
        
        // 检查表是否存在
        const exists = await checkTableExists(table);
        tableStatus[table] = { exists };
        
        if (exists) {
            // 检查字段
            const fieldCheck = await checkTableFields(table);
            tableStatus[table].fieldCheck = fieldCheck;
            
            if (!fieldCheck.success && fieldCheck.missingField) {
                if (!allMissingFields[table]) {
                    allMissingFields[table] = [];
                }
                allMissingFields[table].push(fieldCheck.missingField);
            }
        }
    }
    
    // 输出检查结果总结
    console.log(chalk.blue('\n📊 检查结果总结:'));
    
    Object.entries(tableStatus).forEach(([table, status]) => {
        const existsIcon = status.exists ? '✅' : '❌';
        const fieldsIcon = status.fieldCheck?.success ? '✅' : '❌';
        
        console.log(chalk.white(`\n📋 ${table}:`));
        console.log(`   ${existsIcon} 表存在: ${status.exists}`);
        if (status.exists) {
            console.log(`   ${fieldsIcon} 字段完整: ${status.fieldCheck?.success || false}`);
            if (status.fieldCheck?.missingField) {
                console.log(chalk.red(`   ⚠️  缺失字段: ${status.fieldCheck.missingField}`));
            }
        }
    });
    
    // 生成修复建议
    if (Object.keys(allMissingFields).length > 0) {
        console.log(chalk.blue('\n🔧 修复建议:'));
        
        Object.entries(allMissingFields).forEach(([table, fields]) => {
            generateRepairSQL(table, fields);
        });
        
        console.log(chalk.yellow('\n📋 完整修复步骤:'));
        console.log(chalk.white('1. 复制上面的SQL语句'));
        console.log(chalk.white('2. 在Supabase SQL Editor中执行'));
        console.log(chalk.white('3. 重新运行验证测试'));
    } else {
        console.log(chalk.green('\n🎉 所有表结构都正常！'));
    }
    
    return tableStatus;
}

// 执行检查
if (require.main === module) {
    runTableStructureCheck();
}

module.exports = {
    runTableStructureCheck,
    checkTableExists,
    checkTableFields
};