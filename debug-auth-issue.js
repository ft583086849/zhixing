#!/usr/bin/env node

/**
 * 🔍 诊断认证API问题
 * 检查管理员账户和登录流程
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

// 配置
const BASE_URL = 'https://zhixing-seven.vercel.app/api';
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${colors.green}✅ ${prefix} ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}❌ ${prefix} ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠️  ${prefix} ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.blue}ℹ️  ${prefix} ${message}${colors.reset}`);
      break;
  }
};

// 检查数据库中的管理员账户
const checkAdminInDatabase = async () => {
  try {
    log('检查数据库中的管理员账户...', 'info');
    const connection = await mysql.createConnection(dbConfig);
    
    const [admins] = await connection.execute(
      'SELECT id, username, created_at FROM admins ORDER BY created_at DESC'
    );
    
    await connection.end();
    
    if (admins.length === 0) {
      log('数据库中没有管理员账户！', 'error');
      return false;
    } else {
      log(`找到 ${admins.length} 个管理员账户:`, 'success');
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ID: ${admin.id}, 用户名: ${admin.username}, 创建时间: ${admin.created_at}`);
      });
      return true;
    }
  } catch (error) {
    log(`数据库连接失败: ${error.message}`, 'error');
    return false;
  }
};

// 测试登录API详细响应
const testLoginAPI = async () => {
  try {
    log('测试登录API详细响应...', 'info');
    
    const response = await axios.post(`${BASE_URL}/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    log(`登录API响应状态: ${response.status}`, 'info');
    log(`登录API响应数据:`, 'info');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.token) {
      log('JWT token 生成成功', 'success');
      return true;
    } else if (response.data.success === false) {
      log(`登录失败: ${response.data.message}`, 'error');
      return false;
    } else {
      log('登录响应缺少token字段', 'error');
      return false;
    }
    
  } catch (error) {
    log(`登录API调用失败: ${error.message}`, 'error');
    if (error.response) {
      log(`错误响应状态: ${error.response.status}`, 'error');
      log(`错误响应数据:`, 'error');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
};

// 测试其他认证相关API
const testOtherAuthAPIs = async () => {
  try {
    log('测试认证API可访问性...', 'info');
    
    // 测试验证接口
    const verifyResponse = await axios.get(`${BASE_URL}/auth?path=verify`, {
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    
    log(`验证API响应: ${verifyResponse.status}`, 'info');
    
  } catch (error) {
    if (error.response?.status === 401) {
      log('验证API正常工作（正确拒绝无效token）', 'success');
    } else {
      log(`验证API异常: ${error.message}`, 'warning');
    }
  }
};

// 主诊断流程
const runDiagnosis = async () => {
  console.log(`${colors.bold}${colors.blue}🔍 开始认证问题诊断${colors.reset}\n`);
  
  // 1. 检查数据库管理员账户
  const hasAdmins = await checkAdminInDatabase();
  console.log('');
  
  // 2. 测试登录API
  const loginWorks = await testLoginAPI();
  console.log('');
  
  // 3. 测试其他认证API
  await testOtherAuthAPIs();
  console.log('');
  
  // 结果分析
  console.log(`${colors.bold}📊 诊断结果分析${colors.reset}`);
  
  if (!hasAdmins) {
    console.log(`${colors.red}🚨 需要先创建管理员账户${colors.reset}`);
    console.log(`建议运行: node create-zhixing-admin.js`);
  } else if (!loginWorks) {
    console.log(`${colors.red}🚨 登录API存在问题${colors.reset}`);
    console.log(`需要检查认证API代码和JWT配置`);
  } else {
    console.log(`${colors.green}✅ 认证系统正常工作${colors.reset}`);
  }
};

// 执行诊断
runDiagnosis()
  .catch((error) => {
    console.error(`${colors.red}诊断执行出错: ${error.message}${colors.reset}`);
    process.exit(1);
  });