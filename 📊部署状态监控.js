#!/usr/bin/env node

/**
 * 📊 部署状态监控
 * 监控Vercel部署进度和验证修复效果
 * Commit: 3247272 - React应用挂载配置修复
 */

const chalk = require('chalk');

const CONFIG = {
    frontendUrl: 'https://zhixing.vercel.app',
    commitId: '3247272',
    expectedChanges: [
        'React应用正确挂载',
        'Supabase环境变量生效',
        '页面路由正常工作',
        '管理员页面可访问'
    ]
};

console.log(chalk.blue('📊 开始监控部署状态'));
console.log(chalk.gray(`Commit: ${CONFIG.commitId} - React应用挂载配置修复`));
console.log(chalk.gray('=' * 60));

let monitorCount = 0;
const maxMonitors = 10; // 最多监控10次
const monitorInterval = 30000; // 30秒间隔

async function monitorDeployment() {
    monitorCount++;
    console.log(chalk.yellow(`\n🔍 第${monitorCount}次检查 (${new Date().toLocaleTimeString()})`));
    
    const results = [];
    
    try {
        // 1. 检查前端访问
        await checkFrontendAccess(results);
        
        // 2. 检查React应用挂载
        await checkReactMounting(results);
        
        // 3. 检查路由功能
        await checkRouting(results);
        
        // 4. 检查Supabase连接
        await checkSupabaseConnection(results);
        
        // 分析结果
        analyzeResults(results);
        
        // 检查是否需要继续监控
        const allPassed = results.every(r => r.status === 'PASS');
        
        if (allPassed) {
            console.log(chalk.green('\n🎉 部署成功！所有检查都通过了'));
            outputFinalReport(results);
            return;
        }
        
        if (monitorCount >= maxMonitors) {
            console.log(chalk.red('\n⏰ 监控超时，但仍有问题未解决'));
            outputFinalReport(results);
            return;
        }
        
        console.log(chalk.yellow(`\n⏳ ${monitorInterval/1000}秒后继续检查...`));
        setTimeout(monitorDeployment, monitorInterval);
        
    } catch (error) {
        console.error(chalk.red('❌ 监控过程出错:'), error.message);
        
        if (monitorCount < maxMonitors) {
            setTimeout(monitorDeployment, monitorInterval);
        }
    }
}

// 1. 检查前端访问
async function checkFrontendAccess(results) {
    try {
        console.log('   📱 检查前端访问...');
        
        const response = await fetch(CONFIG.frontendUrl);
        const status = response.status;
        
        if (status === 200) {
            results.push({
                test: '前端访问',
                status: 'PASS',
                details: `HTTP ${status} - 部署成功`
            });
        } else {
            results.push({
                test: '前端访问',
                status: 'FAIL',
                details: `HTTP ${status} - 部署可能失败`
            });
        }
        
    } catch (error) {
        results.push({
            test: '前端访问',
            status: 'FAIL',
            details: `网络错误: ${error.message}`
        });
    }
}

// 2. 检查React应用挂载
async function checkReactMounting(results) {
    try {
        console.log('   ⚛️  检查React应用挂载...');
        
        const response = await fetch(CONFIG.frontendUrl);
        const html = await response.text();
        
        // 检查是否有root元素
        if (html.includes('id="root"')) {
            results.push({
                test: 'React Root元素',
                status: 'PASS',
                details: '检测到root div'
            });
        } else {
            results.push({
                test: 'React Root元素',
                status: 'FAIL',
                details: '未检测到root div'
            });
        }
        
        // 检查是否有React相关脚本
        if (html.includes('static/js/') || html.includes('.js')) {
            results.push({
                test: 'React脚本加载',
                status: 'PASS',
                details: '检测到JavaScript文件'
            });
        } else {
            results.push({
                test: 'React脚本加载',
                status: 'FAIL',
                details: '未检测到JavaScript文件'
            });
        }
        
    } catch (error) {
        results.push({
            test: 'React应用挂载',
            status: 'FAIL',
            details: `检查失败: ${error.message}`
        });
    }
}

// 3. 检查路由功能
async function checkRouting(results) {
    try {
        console.log('   🛣️  检查路由功能...');
        
        const testRoutes = ['/admin', '/sales', '/purchase'];
        let routeResults = [];
        
        for (const route of testRoutes) {
            try {
                const response = await fetch(`${CONFIG.frontendUrl}${route}`);
                routeResults.push({
                    route,
                    status: response.status,
                    success: response.status === 200
                });
            } catch (error) {
                routeResults.push({
                    route,
                    status: 'ERROR',
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successfulRoutes = routeResults.filter(r => r.success).length;
        const totalRoutes = routeResults.length;
        
        if (successfulRoutes === totalRoutes) {
            results.push({
                test: '路由功能',
                status: 'PASS',
                details: `所有${totalRoutes}个路由都正常`
            });
        } else if (successfulRoutes > 0) {
            results.push({
                test: '路由功能',
                status: 'PARTIAL',
                details: `${successfulRoutes}/${totalRoutes}个路由正常`
            });
        } else {
            results.push({
                test: '路由功能',
                status: 'FAIL',
                details: '所有路由都失败'
            });
        }
        
    } catch (error) {
        results.push({
            test: '路由功能',
            status: 'FAIL',
            details: `检查失败: ${error.message}`
        });
    }
}

// 4. 检查Supabase连接
async function checkSupabaseConnection(results) {
    try {
        console.log('   🔗 检查Supabase连接...');
        
        const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
        
        const response = await fetch(`${supabaseUrl}/rest/v1/admins?select=id&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            results.push({
                test: 'Supabase连接',
                status: 'PASS',
                details: '数据库连接正常'
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

// 分析结果
function analyzeResults(results) {
    console.log(chalk.blue('\n   📊 本次检查结果:'));
    
    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : 
                    result.status === 'PARTIAL' ? '⚠️' : '❓';
        const color = result.status === 'PASS' ? 'green' : 
                     result.status === 'FAIL' ? 'red' : 'yellow';
        
        console.log(chalk[color](`   ${icon} ${result.test}: ${result.details}`));
    });
}

// 输出最终报告
function outputFinalReport(results) {
    console.log(chalk.blue('\n📋 最终部署报告'));
    console.log(chalk.gray('=' * 60));
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const partialCount = results.filter(r => r.status === 'PARTIAL').length;
    
    console.log(chalk.green(`✅ 通过: ${passCount}`));
    console.log(chalk.red(`❌ 失败: ${failCount}`));
    console.log(chalk.yellow(`⚠️  部分: ${partialCount}`));
    
    if (failCount === 0 && partialCount === 0) {
        console.log(chalk.green('\n🎉 部署完全成功！'));
        console.log(chalk.blue('🔗 可以访问: https://zhixing.vercel.app'));
    } else {
        console.log(chalk.yellow('\n⚠️  部署有问题，需要进一步调试'));
    }
}

// 开始监控
console.log(chalk.yellow('⏳ 等待10秒让Vercel完成部署...'));
setTimeout(() => {
    monitorDeployment();
}, 10000); // 10秒后开始第一次检查