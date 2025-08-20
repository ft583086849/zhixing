/**
 * 浏览器测试脚本 - 用于检查管理后台概览页面数据显示
 * 用户只需要点击运行即可完成测试
 */

const { spawn } = require('child_process');
const open = require('child_process').exec;

console.log('🚀 启动管理后台概览页面测试...\n');

// 检查服务器是否运行
function checkServerStatus() {
    return new Promise((resolve) => {
        const http = require('http');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 3000
        };
        
        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ 本地开发服务器运行正常');
                resolve(true);
            } else {
                console.log('⚠️  服务器响应异常，状态码:', res.statusCode);
                resolve(false);
            }
        });
        
        req.on('error', () => {
            console.log('❌ 本地开发服务器未运行');
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ 服务器响应超时');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// 主测试流程
async function runBrowserTest() {
    // 1. 检查服务器状态
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
        console.log('\n❌ 服务器未运行，请先启动开发服务器:');
        console.log('   cd client && npm start');
        return;
    }
    
    // 2. 打开浏览器到正确的管理后台地址
    console.log('\n🌐 正在打开浏览器到管理后台...');
    
    // 根据操作系统选择打开浏览器的命令
    const platform = process.platform;
    let openCommand;
    
    if (platform === 'darwin') {
        openCommand = 'open';  // macOS
    } else if (platform === 'win32') {
        openCommand = 'start'; // Windows
    } else {
        openCommand = 'xdg-open'; // Linux
    }
    
    // 打开管理后台页面 - 注意正确的路径是 /admin/dashboard
    const adminUrl = 'http://localhost:3000/admin/dashboard';
    
    open(`${openCommand} ${adminUrl}`, (error) => {
        if (error) {
            console.log('⚠️  无法自动打开浏览器，请手动访问:', adminUrl);
        } else {
            console.log('✅ 已打开浏览器到:', adminUrl);
        }
    });
    
    // 3. 显示测试指南
    console.log('\n📋 手动测试指南:');
    console.log('=' .repeat(60));
    console.log('1. 🔐 登录管理后台:');
    console.log('   如果显示登录页面，请使用管理员账号登录');
    console.log('   (查看项目文档或询问管理员获取账号信息)');
    
    console.log('\n2. 📊 检查数据概览页面(应该已自动显示):');
    console.log('   - 页面标题应显示"数据概览"');
    console.log('   - 左侧菜单"数据概览"应被选中');
    
    console.log('\n3. 🏆 Top5销售排行榜检查:');
    console.log('   - 查看页面下方的"Top5销售排行榜"表格');
    console.log('   - 检查是否显示销售员姓名和金额数据');
    console.log('   - 如果显示"暂无数据"，说明当前没有销售数据');
    
    console.log('\n4. 📈 订单分类统计检查:');
    console.log('   - 查看圆形进度条显示的百分比');
    console.log('   - 检查7天免费、1个月、3个月等各类订单占比');
    console.log('   - 如果都显示0%，说明当前没有订单数据');
    
    console.log('\n5. 📋 转化率统计表格检查:');
    console.log('   - 查看"转化率统计"部分的表格');
    console.log('   - 检查订单转化、收费订单、销售转化三行数据');
    console.log('   - 观察转化率百分比是否合理');
    
    console.log('\n6. 🔧 错误检查:');
    console.log('   - 按F12打开开发者工具');
    console.log('   - 查看Console选项卡是否有红色错误');
    console.log('   - 查看Network选项卡API请求是否成功');
    
    console.log('\n7. 📸 如果发现问题:');
    console.log('   - 截图保存问题页面');
    console.log('   - 复制控制台错误信息');
    console.log('   - 记录具体的显示问题(如哪些数据为空)');
    
    console.log('=' .repeat(60));
    
    // 4. 提供备用访问方式
    console.log('\n🔗 备用访问地址:');
    console.log('   - 主要地址: http://localhost:3000/admin/dashboard');
    console.log('   - 如果需要重新登录: http://localhost:3000/admin');
    console.log('   - 财务统计页面: http://localhost:3000/admin/finance');
    console.log('   - 订单管理页面: http://localhost:3000/admin/orders');
    console.log('   - 销售管理页面: http://localhost:3000/admin/sales');
    
    // 5. 等待用户反馈
    console.log('\n⏳ 请按照上述指南检查页面，然后报告检查结果...');
    
    // 设置定时提醒
    setTimeout(() => {
        console.log('\n💡 提醒: 请重点关注Top5销售排行榜是否有数据显示');
        console.log('   如果排行榜为空，可能的原因:');
        console.log('   1. 数据库中暂无销售数据');
        console.log('   2. API请求失败');
        console.log('   3. 数据处理逻辑有问题');
    }, 10000); // 10秒后提醒
    
    setTimeout(() => {
        console.log('\n🔄 如果页面长时间加载，请检查:');
        console.log('   - 网络连接是否正常');
        console.log('   - 数据库连接是否正常');
        console.log('   - 浏览器控制台是否有错误信息');
    }, 30000); // 30秒后再次提醒
}

// 运行测试
if (require.main === module) {
    runBrowserTest().catch(error => {
        console.error('❌ 测试运行失败:', error);
    });
}

module.exports = runBrowserTest;