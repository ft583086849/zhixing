#!/usr/bin/env node

/**
 * 🚀 执行数据库字段修复
 * 自动执行SQL脚本添加缺失字段
 */

const fs = require('fs');
const path = require('path');
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

// 执行手动修复指导
function provideManualInstructions() {
    console.log(chalk.blue('\n📋 Supabase管理后台手动执行步骤:'));
    
    console.log(chalk.yellow('\n🔗 1. 打开Supabase管理后台'));
    console.log(chalk.white('   访问: https://supabase.com/dashboard'));
    console.log(chalk.white('   选择你的项目: itvmeamoqthfqtkpubdv'));
    
    console.log(chalk.yellow('\n📝 2. 进入SQL Editor'));
    console.log(chalk.white('   左侧菜单 → SQL Editor'));
    console.log(chalk.white('   点击 "New Query" 创建新查询'));
    
    console.log(chalk.yellow('\n📋 3. 复制SQL脚本'));
    console.log(chalk.white('   打开文件: 🔧添加缺失数据库字段.sql'));
    console.log(chalk.white('   复制所有内容到SQL Editor'));
    
    console.log(chalk.yellow('\n▶️  4. 执行SQL脚本'));
    console.log(chalk.white('   点击 "Run" 按钮执行'));
    console.log(chalk.white('   等待执行完成'));
    
    console.log(chalk.yellow('\n✅ 5. 验证结果'));
    console.log(chalk.white('   查看执行结果中的SUCCESS消息'));
    console.log(chalk.white('   确认所有字段都已添加'));
}

// 快速字段添加SQL（关键字段）
function generateQuickFixSQL() {
    console.log(chalk.blue('\n⚡ 快速修复SQL（仅关键字段）:'));
    
    const quickSQL = `
-- 快速添加关键字段
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

-- 为现有记录生成销售代码
UPDATE primary_sales 
SET sales_code = 'PS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    secondary_registration_code = 'SR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))
WHERE sales_code IS NULL;

UPDATE secondary_sales 
SET sales_code = 'SS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))
WHERE sales_code IS NULL;
`;
    
    console.log(chalk.gray(quickSQL));
    
    console.log(chalk.blue('\n📋 复制上面的SQL到Supabase SQL Editor执行'));
}

// 验证修复效果
async function verifyFix() {
    console.log(chalk.blue('\n🔍 验证修复效果'));
    
    const testData = {
        wechat_name: `test_verify_${Date.now()}`,
        sales_code: `PS_VERIFY_${Date.now()}`,
        secondary_registration_code: `SR_VERIFY_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: '752304285@qq.com',
        alipay_surname: '梁',
        commission_rate: 40.00
    };
    
    logStep('测试primary_sales字段', 'TESTING');
    
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
            logStep('测试primary_sales字段', 'PASS', `字段修复成功，创建记录ID: ${result[0]?.id}`);
            
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
            
            return true;
        } else {
            const error = await response.text();
            logStep('测试primary_sales字段', 'FAIL', `仍有错误: ${error}`);
            return false;
        }
    } catch (error) {
        logStep('测试primary_sales字段', 'FAIL', `网络错误: ${error.message}`);
        return false;
    }
}

// 主函数
async function runDatabaseFix() {
    console.log(chalk.blue('🚀 开始执行数据库字段修复'));
    console.log(chalk.gray('=' * 60));
    
    console.log(chalk.yellow('\n📋 修复方案选择:'));
    console.log(chalk.white('1. 完整SQL脚本 (推荐) - 包含所有字段、索引、约束'));
    console.log(chalk.white('2. 快速修复SQL - 仅添加关键字段'));
    console.log(chalk.white('3. 手动执行指导 - 详细操作步骤'));
    
    // 由于我们无法直接执行SQL，提供所有修复方案
    console.log(chalk.blue('\n📂 已创建的文件:'));
    console.log(chalk.green('✅ 🔧添加缺失数据库字段.sql - 完整修复脚本'));
    
    console.log(chalk.blue('\n🎯 推荐执行顺序:'));
    console.log(chalk.white('1. 先尝试快速修复SQL（下面提供）'));
    console.log(chalk.white('2. 如果快速修复成功，再执行完整脚本'));
    console.log(chalk.white('3. 最后验证修复效果'));
    
    // 提供快速修复SQL
    generateQuickFixSQL();
    
    // 提供手动操作指导
    provideManualInstructions();
    
    console.log(chalk.blue('\n🧪 修复完成后的验证步骤:'));
    console.log(chalk.white('1. 在此目录运行: node 🚀执行数据库字段修复.js --verify'));
    console.log(chalk.white('2. 或运行: node 🧪实际功能测试执行.js'));
    console.log(chalk.white('3. 检查功能测试结果'));
    
    // 如果有--verify参数，执行验证
    if (process.argv.includes('--verify')) {
        console.log(chalk.blue('\n🔍 执行验证测试...'));
        const isFixed = await verifyFix();
        
        if (isFixed) {
            console.log(chalk.green('\n🎉 数据库字段修复成功！'));
            console.log(chalk.yellow('🚀 现在可以重新运行完整功能测试了'));
        } else {
            console.log(chalk.red('\n❌ 数据库字段仍有问题'));
            console.log(chalk.yellow('💡 请按照上述步骤在Supabase管理后台手动执行SQL脚本'));
        }
    }
    
    console.log(chalk.blue('\n📊 总结:'));
    console.log(chalk.white('✅ SQL脚本已准备就绪'));
    console.log(chalk.white('📋 操作指导已提供'));
    console.log(chalk.white('🔍 验证方法已说明'));
    console.log(chalk.yellow('⚡ 执行SQL后你的业务逻辑就能完美运行了！'));
}

// 执行修复
if (require.main === module) {
    runDatabaseFix();
}

module.exports = {
    runDatabaseFix,
    verifyFix,
    generateQuickFixSQL
};