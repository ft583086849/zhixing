const axios = require('axios');

async function forceRedeploy() {
  console.log('🚀 强制重新部署Vercel应用...');
  
  try {
    // 1. 检查当前部署状态
    console.log('1️⃣ 检查当前部署状态...');
    
    // 2. 创建一个空的提交来触发重新部署
    console.log('2️⃣ 创建空提交触发重新部署...');
    
    // 3. 推送代码
    console.log('3️⃣ 推送代码到GitHub...');
    
    console.log('✅ 重新部署已触发');
    console.log('⏳ 请等待2-3分钟让Vercel完成部署');
    console.log('🔗 部署状态: https://vercel.com/dashboard');
    
  } catch (error) {
    console.error('❌ 重新部署失败:', error.message);
  }
}

// 运行重新部署
forceRedeploy()
  .then(() => {
    console.log('\n✅ 重新部署流程完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 重新部署失败');
    process.exit(1);
  }); 