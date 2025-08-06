#!/usr/bin/env node

/**
 * 实时线上监控 - 专注监控部署变化
 */

const { spawn } = require('child_process');

console.log('🔍 开始实时监控线上部署...\n');
console.log('监控重点：');
console.log('• main分支 (13cc91a): runtime修复');
console.log('• structure-refactor分支 (efe4705): 项目结构重构');
console.log('• 预期：API从404变为200表示成功\n');

let checkCount = 0;
let lastStatus = null;

async function quickCheck() {
    checkCount++;
    const time = new Date().toLocaleTimeString('zh-CN');
    
    console.log(`======= 第${checkCount}次检查 (${time}) =======`);
    
    try {
        // 检查主要API
        const healthCheck = await testEndpoint('/api/health', 'Health API');
        const adminCheck = await testEndpoint('/api/admin?action=overview', 'Admin API');
        
        // 分析状态变化
        const currentStatus = healthCheck.status;
        if (currentStatus !== lastStatus) {
            if (currentStatus === 200) {
                console.log('\n🎉🎉🎉 重大变化检测到！');
                console.log('✅ API状态已恢复：404 → 200');
                console.log('🚀 部署成功！问题已解决！');
                console.log('\n📋 下一步：验证所有功能是否正常');
                return true; // 成功标志
            } else if (lastStatus === 404 && currentStatus !== 404) {
                console.log(`\n⚡ 状态变化：404 → ${currentStatus} (进展中...)`);
            }
        }
        
        lastStatus = currentStatus;
        
        if (healthCheck.status === 404 && adminCheck.status === 404) {
            console.log('⏳ 仍然404，等待部署...');
        } else {
            console.log('🔄 状态有变化，继续观察...');
        }
        
    } catch (error) {
        console.log(`❌ 监控异常: ${error.message}`);
    }
    
    return false; // 继续监控
}

async function testEndpoint(path, name) {
    return new Promise((resolve) => {
        const curl = spawn('curl', [
            '-X', 'GET',
            `https://zhixing.vercel.app${path}`,
            '-w', '\\n%{http_code}',
            '-s',
            '--max-time', '6'
        ]);
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.on('close', () => {
            const lines = output.trim().split('\\n');
            const status = parseInt(lines[lines.length - 1]) || 0;
            
            const icon = status === 200 ? '✅' : status === 404 ? '❌' : '⚠️';
            console.log(`${icon} ${name}: ${status}`);
            
            resolve({ status, name });
        });
    });
}

// 开始监控
async function startRealTimeMonitoring() {
    console.log('🎯 开始实时监控...\n');
    
    // 立即检查一次
    const success = await quickCheck();
    if (success) {
        console.log('\n👋 监控结束 - 部署成功！');
        process.exit(0);
    }
    
    // 每20秒检查一次
    const interval = setInterval(async () => {
        const success = await quickCheck();
        if (success) {
            console.log('\n👋 监控结束 - 部署成功！');
            clearInterval(interval);
            process.exit(0);
        }
        
        // 如果检查超过15次还没成功，提示手动检查
        if (checkCount >= 15) {
            console.log('\n⏰ 已监控15次，请手动检查Vercel控制台部署状态');
            clearInterval(interval);
            process.exit(0);
        }
        
        console.log('⏳ 20秒后进行下一次检查...\n');
    }, 20000);
    
    // Ctrl+C 停止
    process.on('SIGINT', () => {
        console.log('\n\n📊 监控总结:');
        console.log(`• 总共检查了 ${checkCount} 次`);
        console.log(`• 最后状态: ${lastStatus || '未知'}`);
        console.log('👋 监控已停止');
        clearInterval(interval);
        process.exit(0);
    });
}

startRealTimeMonitoring().catch(console.error);