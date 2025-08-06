#!/usr/bin/env node

/**
 * 监控线上部署状态 - 实时跟踪两个分支的部署进度
 * 
 * 监控目标：
 * 1. main分支 (13cc91a) - runtime修复
 * 2. structure-refactor分支 (efe4705) - 项目结构重构 + runtime修复
 */

const { spawn } = require('child_process');

console.log('🔍 开始监控线上部署状态...\n');

let iteration = 0;

async function checkDeploymentStatus() {
    iteration++;
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    
    console.log(`\n=================== 第${iteration}次检查 (${timestamp}) ===================`);
    
    // 测试API端点
    const endpoints = [
        { name: 'Health API', url: 'https://zhixing.vercel.app/api/health' },
        { name: 'Admin API', url: 'https://zhixing.vercel.app/api/admin?action=overview' },
        { name: 'Auth API', url: 'https://zhixing.vercel.app/api/auth' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 测试 ${endpoint.name}...`);
            
            const curlProcess = spawn('curl', [
                '-X', 'GET',
                endpoint.url,
                '-w', '\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s\n',
                '-s',
                '--max-time', '10'
            ]);
            
            let output = '';
            let error = '';
            
            curlProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            curlProcess.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            await new Promise((resolve) => {
                curlProcess.on('close', (code) => {
                    const lines = output.split('\n');
                    const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
                    const timeLine = lines.find(line => line.startsWith('TIME:'));
                    
                    const status = statusLine ? statusLine.split(':')[1] : 'unknown';
                    const time = timeLine ? timeLine.split(':')[1] : 'unknown';
                    
                    const response = lines.filter(line => 
                        !line.startsWith('HTTP_STATUS:') && 
                        !line.startsWith('TIME:') && 
                        line.trim()
                    ).join('\n').trim();
                    
                    if (status === '200') {
                        console.log(`   ✅ 状态: ${status} | 响应时间: ${time}`);
                        console.log(`   📄 响应: ${response.substring(0, 100)}...`);
                    } else if (status === '404') {
                        console.log(`   ❌ 状态: ${status} | API未找到`);
                        console.log(`   📄 响应: ${response}`);
                    } else {
                        console.log(`   ⚠️  状态: ${status} | 响应时间: ${time}`);
                        console.log(`   📄 响应: ${response.substring(0, 100)}...`);
                    }
                    
                    if (error) {
                        console.log(`   🔴 错误: ${error.trim()}`);
                    }
                    
                    resolve();
                });
            });
            
        } catch (err) {
            console.log(`   💥 测试失败: ${err.message}`);
        }
    }
    
    // 检查前端页面
    console.log(`\n🌐 测试前端页面...`);
    try {
        const frontendProcess = spawn('curl', [
            '-X', 'GET',
            'https://zhixing.vercel.app/',
            '-w', '\nHTTP_STATUS:%{http_code}\n',
            '-s',
            '--max-time', '10'
        ]);
        
        let frontendOutput = '';
        
        frontendProcess.stdout.on('data', (data) => {
            frontendOutput += data.toString();
        });
        
        await new Promise((resolve) => {
            frontendProcess.on('close', (code) => {
                const lines = frontendOutput.split('\n');
                const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
                const status = statusLine ? statusLine.split(':')[1] : 'unknown';
                
                if (status === '200') {
                    console.log(`   ✅ 前端状态: ${status} | 页面正常加载`);
                } else {
                    console.log(`   ❌ 前端状态: ${status} | 页面加载异常`);
                }
                resolve();
            });
        });
        
    } catch (err) {
        console.log(`   💥 前端测试失败: ${err.message}`);
    }
    
    console.log(`\n⏰ 等待30秒后进行下一次检查...`);
}

// 执行监控
async function startMonitoring() {
    console.log('🎯 监控重点：');
    console.log('• main分支: 13cc91a - runtime修复是否生效');
    console.log('• structure-refactor分支: efe4705 - 项目结构重构是否成功');
    console.log('• 预期结果: API从404变为200表示部署成功\n');
    
    // 立即执行第一次检查
    await checkDeploymentStatus();
    
    // 每30秒检查一次
    const interval = setInterval(async () => {
        await checkDeploymentStatus();
        
        // 检查是否应该停止监控（如果连续成功）
        if (iteration >= 20) {
            console.log('\n🛑 监控已运行20次，请手动检查结果或重新启动监控');
            clearInterval(interval);
        }
    }, 30000);
    
    // 捕获Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n\n📋 监控总结:');
        console.log(`• 总共检查了 ${iteration} 次`);
        console.log('• 如果API仍然404，说明需要进一步调试');
        console.log('• 如果API返回200，说明部署成功！');
        console.log('\n👋 监控已停止');
        clearInterval(interval);
        process.exit(0);
    });
}

startMonitoring().catch(console.error);