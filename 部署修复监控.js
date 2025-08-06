#!/usr/bin/env node

/**
 * 部署修复监控 - 专门监控nodejs18.x runtime修复后的部署状态
 */

const { spawn } = require('child_process');

console.log('🔍 开始监控nodejs18.x runtime修复部署...\n');
console.log('📋 监控重点：');
console.log('• 提交: 21a965f - 回退runtime到nodejs18.x格式');
console.log('• 预期: 解决"Function Runtimes must have a valid version"错误');
console.log('• 成功标志: API从404变为200\n');

let checkCount = 0;
let lastStatus = null;
let successiveErrors = 0;

async function monitorDeployment() {
    checkCount++;
    const time = new Date().toLocaleTimeString('zh-CN');
    
    console.log(`======= 第${checkCount}次检查 (${time}) =======`);
    
    try {
        // 检查主要API端点
        const healthResult = await testAPI('/api/health', 'Health API');
        const adminResult = await testAPI('/api/admin?action=overview', 'Admin API');
        
        const currentStatus = healthResult.status;
        
        // 分析状态变化
        if (currentStatus !== lastStatus) {
            if (currentStatus === 200) {
                console.log('\n🎉🎉🎉 重大突破！');
                console.log('✅ API状态: 404 → 200');
                console.log('🚀 runtime修复成功！部署完成！');
                console.log('📊 nodejs18.x格式生效！');
                return true; // 成功标志
            } else if (currentStatus === 500) {
                console.log('\n⚡ 状态变化: 404 → 500');
                console.log('🔄 可能是部署中的过渡状态...');
            } else if (currentStatus === 0) {
                console.log('\n⚠️  状态变化: 404 → 0 (连接超时)');
                console.log('🔄 可能正在重新部署...');
                successiveErrors++;
            } else {
                console.log(`\n📈 状态变化: ${lastStatus || '?'} → ${currentStatus}`);
            }
        }
        
        lastStatus = currentStatus;
        
        // 状态分析
        if (currentStatus === 404) {
            console.log('⏳ 仍然404 - 等待新部署生效...');
            successiveErrors = 0;
        } else if (currentStatus === 0) {
            console.log('🔄 连接超时 - 可能正在部署中...');
            if (successiveErrors > 3) {
                console.log('⚠️  连续多次超时，可能有其他问题');
            }
        } else {
            console.log(`🔍 当前状态: ${currentStatus} - 继续观察...`);
            successiveErrors = 0;
        }
        
    } catch (error) {
        console.log(`❌ 监控异常: ${error.message}`);
        successiveErrors++;
    }
    
    return false; // 继续监控
}

async function testAPI(path, name) {
    return new Promise((resolve) => {
        const curl = spawn('curl', [
            '-X', 'GET',
            `https://zhixing.vercel.app${path}`,
            '-w', '\\n%{http_code}',
            '-s',
            '--max-time', '8'
        ]);
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.on('close', () => {
            const lines = output.trim().split('\\n');
            const status = parseInt(lines[lines.length - 1]) || 0;
            
            const icon = status === 200 ? '✅' : 
                        status === 404 ? '❌' : 
                        status === 500 ? '⚠️' : 
                        status === 0 ? '🔄' : '❓';
                        
            console.log(`${icon} ${name}: ${status}`);
            
            resolve({ status, name });
        });
    });
}

// 开始监控
async function startMonitoring() {
    console.log('🎯 开始实时监控...\n');
    
    // 立即检查一次
    const success = await monitorDeployment();
    if (success) {
        console.log('\n👋 监控结束 - 部署成功！');
        process.exit(0);
    }
    
    // 每25秒检查一次
    const interval = setInterval(async () => {
        const success = await monitorDeployment();
        if (success) {
            console.log('\n👋 监控结束 - 部署成功！');
            clearInterval(interval);
            process.exit(0);
        }
        
        // 如果检查超过12次还没成功，提示
        if (checkCount >= 12) {
            console.log('\n⏰ 已监控12次，如果还是失败请检查Vercel控制台日志');
            console.log('🔍 可能需要检查构建日志中的具体错误信息');
            clearInterval(interval);
            process.exit(0);
        }
        
        console.log('⏳ 25秒后进行下一次检查...\n');
    }, 25000);
    
    // Ctrl+C 停止
    process.on('SIGINT', () => {
        console.log('\n\n📊 监控总结:');
        console.log(`• 总共检查了 ${checkCount} 次`);
        console.log(`• 最后状态: ${lastStatus || '未知'}`);
        console.log(`• 连续错误: ${successiveErrors} 次`);
        console.log('👋 监控已停止');
        clearInterval(interval);
        process.exit(0);
    });
}

startMonitoring().catch(console.error);