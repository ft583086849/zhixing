#!/usr/bin/env node

/**
 * 🔍 线上环境诊断验证
 * 检查Vercel部署后的Supabase连接状态
 * Commit: 2cc1b08 - 纯前端React应用配置
 */

const chalk = require('chalk');

// 测试配置
const CONFIG = {
    frontendUrl: 'https://zhixing.vercel.app',
    supabaseUrl: 'https://itvmeamoqthfqtkpubdv.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
};

console.log(chalk.blue('🔍 开始线上环境诊断验证'));
console.log(chalk.gray('Commit: 2cc1b08 - 纯前端React应用配置'));
console.log(chalk.gray('=' * 60));

// 测试步骤
async function runDiagnostics() {
    const results = [];
    
    try {
        // 1. 检查前端部署状态
        console.log(chalk.yellow('\n📱 1. 检查前端部署状态'));
        await testFrontendDeployment(results);
        
        // 2. 检查Supabase连接
        console.log(chalk.yellow('\n🔗 2. 检查Supabase连接'));
        await testSupabaseConnection(results);
        
        // 3. 检查环境变量注入
        console.log(chalk.yellow('\n⚙️  3. 检查环境变量注入'));
        await testEnvironmentVariables(results);
        
        // 4. 检查API调用
        console.log(chalk.yellow('\n🌐 4. 检查API调用'));
        await testApiCalls(results);
        
        // 5. 检查页面渲染
        console.log(chalk.yellow('\n🎨 5. 检查页面渲染'));
        await testPageRendering(results);
        
        // 输出诊断结果
        outputResults(results);
        
    } catch (error) {
        console.error(chalk.red('❌ 诊断过程出错:'), error.message);
    }
}

// 1. 检查前端部署状态
async function testFrontendDeployment(results) {
    try {
        console.log('   正在检查前端访问...');
        
        const response = await fetch(CONFIG.frontendUrl);
        const status = response.status;
        const html = await response.text();
        
        if (status === 200) {
            results.push({
                test: '前端部署状态',
                status: 'PASS',
                details: `HTTP ${status} - 页面可访问`
            });
            
            // 检查HTML内容
            if (html.includes('root')) {
                results.push({
                    test: 'React应用挂载',
                    status: 'PASS',
                    details: '检测到React root元素'
                });
            } else {
                results.push({
                    test: 'React应用挂载',
                    status: 'FAIL',
                    details: '未检测到React root元素'
                });
            }
            
        } else {
            results.push({
                test: '前端部署状态',
                status: 'FAIL',
                details: `HTTP ${status} - 部署可能失败`
            });
        }
        
    } catch (error) {
        results.push({
            test: '前端部署状态',
            status: 'FAIL',
            details: `网络错误: ${error.message}`
        });
    }
}

// 2. 检查Supabase连接
async function testSupabaseConnection(results) {
    try {
        console.log('   正在检查Supabase连接...');
        
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
                details: 'REST API可访问'
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
            details: `连接错误: ${error.message}`
        });
    }
}

// 3. 检查环境变量注入（通过前端JavaScript检查）
async function testEnvironmentVariables(results) {
    try {
        console.log('   正在检查环境变量注入...');
        
        // 尝试访问前端的配置检查端点（如果存在）
        const response = await fetch(`${CONFIG.frontendUrl}/static/js/main.*.js`);
        
        if (response.status === 200) {
            const jsContent = await response.text();
            
            // 检查是否包含Supabase配置
            if (jsContent.includes('itvmeamoqthfqtkpubdv')) {
                results.push({
                    test: '环境变量注入',
                    status: 'PASS',
                    details: '检测到Supabase配置'
                });
            } else {
                results.push({
                    test: '环境变量注入',
                    status: 'FAIL',
                    details: '未检测到Supabase配置'
                });
            }
        } else {
            results.push({
                test: '环境变量注入',
                status: 'UNKNOWN',
                details: '无法检查JavaScript文件'
            });
        }
        
    } catch (error) {
        results.push({
            test: '环境变量注入',
            status: 'UNKNOWN',
            details: `检查失败: ${error.message}`
        });
    }
}

// 4. 检查API调用（模拟前端调用）
async function testApiCalls(results) {
    try {
        console.log('   正在检查数据库表访问...');
        
        // 检查admins表
        const adminsResponse = await fetch(`${CONFIG.supabaseUrl}/rest/v1/admins?select=id`, {
            headers: {
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (adminsResponse.status === 200) {
            results.push({
                test: 'admins表访问',
                status: 'PASS',
                details: 'RLS策略正常'
            });
        } else {
            results.push({
                test: 'admins表访问',
                status: 'FAIL',
                details: `HTTP ${adminsResponse.status} - 可能是RLS策略问题`
            });
        }
        
        // 检查orders表
        const ordersResponse = await fetch(`${CONFIG.supabaseUrl}/rest/v1/orders?select=id&limit=1`, {
            headers: {
                'apikey': CONFIG.supabaseKey,
                'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ordersResponse.status === 200) {
            results.push({
                test: 'orders表访问',
                status: 'PASS',
                details: '数据查询正常'
            });
        } else {
            results.push({
                test: 'orders表访问',
                status: 'FAIL',
                details: `HTTP ${ordersResponse.status}`
            });
        }
        
    } catch (error) {
        results.push({
            test: 'API调用测试',
            status: 'FAIL',
            details: `调用失败: ${error.message}`
        });
    }
}

// 5. 检查页面渲染
async function testPageRendering(results) {
    try {
        console.log('   正在检查特定页面...');
        
        const testPages = [
            { path: '/admin', name: '管理员页面' },
            { path: '/sales', name: '销售注册页面' },
            { path: '/purchase', name: '购买页面' }
        ];
        
        for (const page of testPages) {
            try {
                const response = await fetch(`${CONFIG.frontendUrl}${page.path}`);
                
                if (response.status === 200) {
                    results.push({
                        test: page.name,
                        status: 'PASS',
                        details: '页面可访问'
                    });
                } else {
                    results.push({
                        test: page.name,
                        status: 'FAIL',
                        details: `HTTP ${response.status}`
                    });
                }
            } catch (error) {
                results.push({
                    test: page.name,
                    status: 'FAIL',
                    details: `访问失败: ${error.message}`
                });
            }
        }
        
    } catch (error) {
        results.push({
            test: '页面渲染测试',
            status: 'FAIL',
            details: `测试失败: ${error.message}`
        });
    }
}

// 输出诊断结果
function outputResults(results) {
    console.log(chalk.blue('\n📊 诊断结果汇总'));
    console.log(chalk.gray('=' * 60));
    
    let passCount = 0;
    let failCount = 0;
    let unknownCount = 0;
    
    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : '⚠️';
        const color = result.status === 'PASS' ? 'green' : 
                     result.status === 'FAIL' ? 'red' : 'yellow';
        
        console.log(chalk[color](`${icon} ${result.test}: ${result.details}`));
        
        if (result.status === 'PASS') passCount++;
        else if (result.status === 'FAIL') failCount++;
        else unknownCount++;
    });
    
    console.log(chalk.blue('\n📈 统计信息'));
    console.log(chalk.green(`✅ 通过: ${passCount}`));
    console.log(chalk.red(`❌ 失败: ${failCount}`));
    console.log(chalk.yellow(`⚠️  未知: ${unknownCount}`));
    
    // 给出建议
    console.log(chalk.blue('\n💡 建议操作'));
    if (failCount > 0) {
        console.log(chalk.red('🚨 发现问题，需要修复:'));
        
        const hasRLSIssue = results.some(r => r.details.includes('RLS策略'));
        const hasEnvIssue = results.some(r => r.test.includes('环境变量') && r.status === 'FAIL');
        
        if (hasRLSIssue) {
            console.log('   1. 检查Supabase RLS策略设置');
        }
        if (hasEnvIssue) {
            console.log('   2. 重新部署以确保环境变量生效');
        }
        
        console.log('   3. 检查浏览器开发者工具的控制台错误');
        console.log('   4. 验证Supabase项目配置');
    } else {
        console.log(chalk.green('🎉 所有测试通过！系统运行正常'));
    }
}

// 运行诊断
runDiagnostics().catch(console.error);