#!/usr/bin/env node

/**
 * 🎉 验证新域名部署
 * 测试正确的Vercel域名：zhixing-seven.vercel.app
 */

const chalk = require('chalk');

const CONFIG = {
    // 正确的域名
    correctUrl: 'https://zhixing-seven.vercel.app',
    // 之前一直访问的错误域名
    oldUrl: 'https://zhixing.vercel.app',
    supabaseUrl: 'https://itvmeamoqthfqtkpubdv.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
};

console.log(chalk.blue('🎉 验证新域名部署'));
console.log(chalk.yellow('正确域名: https://zhixing-seven.vercel.app'));
console.log(chalk.gray('之前域名: https://zhixing.vercel.app'));
console.log(chalk.gray('=' * 60));

async function verifyDeployment() {
    const results = [];
    
    try {
        // 1. 对比两个域名的响应
        console.log(chalk.yellow('\n🔍 1. 对比域名响应'));
        await compareDomains(results);
        
        // 2. 测试新域名的React应用
        console.log(chalk.yellow('\n⚛️  2. 测试React应用'));
        await testReactApp(results);
        
        // 3. 测试路由功能
        console.log(chalk.yellow('\n🛣️  3. 测试路由功能'));
        await testRouting(results);
        
        // 4. 测试Supabase集成
        console.log(chalk.yellow('\n🔗 4. 测试Supabase集成'));
        await testSupabaseIntegration(results);
        
        // 输出最终结果
        outputResults(results);
        
    } catch (error) {
        console.error(chalk.red('❌ 验证过程出错:'), error.message);
    }
}

// 1. 对比两个域名的响应
async function compareDomains(results) {
    try {
        console.log('   正在对比两个域名...');
        
        // 测试旧域名
        const oldResponse = await fetch(CONFIG.oldUrl);
        const oldHtml = await oldResponse.text();
        const isOldHexo = oldHtml.includes('Hexo');
        
        console.log(chalk.gray(`   旧域名 (${CONFIG.oldUrl}): ${isOldHexo ? 'Hexo页面' : 'React应用'}`));
        
        // 测试新域名
        const newResponse = await fetch(CONFIG.correctUrl);
        const newHtml = await newResponse.text();
        const isNewReact = newHtml.includes('id="root"');
        
        console.log(chalk.gray(`   新域名 (${CONFIG.correctUrl}): ${isNewReact ? 'React应用' : '其他'}`));
        
        if (isNewReact) {
            results.push({
                test: '域名验证',
                status: 'PASS',
                details: '新域名显示React应用'
            });
        } else {
            results.push({
                test: '域名验证',
                status: 'FAIL',
                details: '新域名仍未显示React应用'
            });
        }
        
    } catch (error) {
        results.push({
            test: '域名验证',
            status: 'FAIL',
            details: `对比失败: ${error.message}`
        });
    }
}

// 2. 测试React应用
async function testReactApp(results) {
    try {
        console.log('   检查React应用元素...');
        
        const response = await fetch(CONFIG.correctUrl);
        const html = await response.text();
        
        // 检查关键React元素
        const hasRoot = html.includes('id="root"');
        const hasReactScripts = html.includes('/static/js/');
        const hasCorrectTitle = html.includes('知行财库');
        
        if (hasRoot && hasReactScripts && hasCorrectTitle) {
            results.push({
                test: 'React应用检测',
                status: 'PASS',
                details: '所有React元素都正确'
            });
        } else {
            results.push({
                test: 'React应用检测',
                status: 'PARTIAL',
                details: `Root: ${hasRoot}, Scripts: ${hasReactScripts}, Title: ${hasCorrectTitle}`
            });
        }
        
    } catch (error) {
        results.push({
            test: 'React应用检测',
            status: 'FAIL',
            details: `检测失败: ${error.message}`
        });
    }
}

// 3. 测试路由功能
async function testRouting(results) {
    try {
        console.log('   测试SPA路由...');
        
        const testRoutes = ['/admin', '/sales', '/purchase'];
        let workingRoutes = 0;
        
        for (const route of testRoutes) {
            try {
                const response = await fetch(`${CONFIG.correctUrl}${route}`);
                if (response.status === 200) {
                    workingRoutes++;
                }
            } catch (error) {
                // 忽略单个路由错误
            }
        }
        
        if (workingRoutes === testRoutes.length) {
            results.push({
                test: 'SPA路由',
                status: 'PASS',
                details: '所有路由都正常'
            });
        } else if (workingRoutes > 0) {
            results.push({
                test: 'SPA路由',
                status: 'PARTIAL',
                details: `${workingRoutes}/${testRoutes.length} 路由正常`
            });
        } else {
            results.push({
                test: 'SPA路由',
                status: 'FAIL',
                details: '所有路由都失败'
            });
        }
        
    } catch (error) {
        results.push({
            test: 'SPA路由',
            status: 'FAIL',
            details: `路由测试失败: ${error.message}`
        });
    }
}

// 4. 测试Supabase集成
async function testSupabaseIntegration(results) {
    try {
        console.log('   测试Supabase连接...');
        
        // 简单的Supabase健康检查
        const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`
            }
        });
        
        if (response.status === 200) {
            results.push({
                test: 'Supabase连接',
                status: 'PASS',
                details: 'API连接正常'
            });
        } else {
            results.push({
                test: 'Supabase连接',
                status: 'FAIL',
                details: `HTTP ${response.status}`
            });
        }
        
    } catch (error) {
        results.push({
            test: 'Supabase连接',
            status: 'FAIL',
            details: `连接失败: ${error.message}`
        });
    }
}

// 输出最终结果
function outputResults(results) {
    console.log(chalk.blue('\n📊 验证结果汇总'));
    console.log(chalk.gray('=' * 60));
    
    let passCount = 0;
    let failCount = 0;
    let partialCount = 0;
    
    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : '⚠️';
        const color = result.status === 'PASS' ? 'green' : 
                     result.status === 'FAIL' ? 'red' : 'yellow';
        
        console.log(chalk[color](`${icon} ${result.test}: ${result.details}`));
        
        if (result.status === 'PASS') passCount++;
        else if (result.status === 'FAIL') failCount++;
        else partialCount++;
    });
    
    console.log(chalk.blue('\n📈 统计信息'));
    console.log(chalk.green(`✅ 通过: ${passCount}`));
    console.log(chalk.yellow(`⚠️  部分: ${partialCount}`));
    console.log(chalk.red(`❌ 失败: ${failCount}`));
    
    // 最终判断
    if (failCount === 0 && partialCount === 0) {
        console.log(chalk.green('\n🎉 完美！新域名部署完全成功！'));
        console.log(chalk.blue('🔗 正确访问地址: https://zhixing-seven.vercel.app'));
    } else if (passCount > failCount) {
        console.log(chalk.yellow('\n⚠️  部署基本成功，但有些问题需要修复'));
    } else {
        console.log(chalk.red('\n❌ 部署仍有问题，需要进一步调试'));
    }
    
    console.log(chalk.blue('\n💡 下次请记住使用正确的域名:'));
    console.log(chalk.green('✅ 正确: https://zhixing-seven.vercel.app'));
    console.log(chalk.red('❌ 错误: https://zhixing.vercel.app'));
}

// 开始验证
console.log(chalk.yellow('⏳ 等待5秒让部署完成...'));
setTimeout(() => {
    verifyDeployment();
}, 5000);