#!/usr/bin/env node

/**
 * 快速部署状态检查 - 每15秒检查一次
 */

console.log('🔍 快速监控部署状态...\n');

let count = 0;

const checkStatus = async () => {
    count++;
    const time = new Date().toLocaleTimeString('zh-CN');
    
    console.log(`\n======== 第${count}次检查 (${time}) ========`);
    
    // 检查API
    try {
        const { spawn } = require('child_process');
        const curl = spawn('curl', [
            '-X', 'GET',
            'https://zhixing.vercel.app/api/health',
            '-w', '\n%{http_code}',
            '-s',
            '--max-time', '8'
        ]);
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        await new Promise((resolve) => {
            curl.on('close', () => {
                const lines = output.trim().split('\n');
                const status = lines[lines.length - 1];
                
                if (status === '200') {
                    console.log('🎉 API状态变化！API已恢复：200 OK');
                    console.log('✅ 部署成功！可以停止监控了！');
                } else if (status === '404') {
                    console.log('⏳ API状态：404 (还在部署中...)');
                } else {
                    console.log(`⚠️ API状态：${status} (异常状态)`);
                }
                resolve();
            });
        });
        
    } catch (err) {
        console.log('❌ 检查失败:', err.message);
    }
};

// 立即检查一次
checkStatus();

// 每15秒检查一次
const interval = setInterval(checkStatus, 15000);

// 5分钟后自动停止
setTimeout(() => {
    console.log('\n⏰ 5分钟监控完成，如果还是404请手动检查Vercel部署日志');
    clearInterval(interval);
    process.exit(0);
}, 300000);

// Ctrl+C停止
process.on('SIGINT', () => {
    console.log('\n👋 监控已停止');
    clearInterval(interval);
    process.exit(0);
});