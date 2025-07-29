// Vercel 数据库服务 - 生产环境安全版本
const mysql = require('mysql2/promise');

// 内存存储（仅用于开发/测试环境）
let memoryStore = {
  sales: [],
  orders: [],
  counter: 1
};

// 数据库连接配置
const dbConfig = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: true
  }
};

// 检查是否有数据库环境变量
const hasDbConfig = process.env.DATABASE_HOST && process.env.DATABASE_USERNAME && process.env.DATABASE_PASSWORD && process.env.DATABASE_NAME;

// 检查是否为生产环境
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

// 创建连接池
let pool = null;

// 初始化连接池
function initializePool() {
  if (!pool && hasDbConfig) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// 执行查询
async function query(sql, params = []) {
  try {
    if (hasDbConfig) {
      const connection = initializePool();
      const [rows] = await connection.execute(sql, params);
      return rows;
    } else {
      // 生产环境不允许降级
      if (isProduction) {
        throw new Error('生产环境必须配置数据库连接');
      }
      // 开发环境可以使用内存存储
      console.warn('⚠️ 开发环境：使用内存存储，数据不会持久化');
      return simulateQuery(sql, params);
    }
  } catch (error) {
    console.error('数据库查询错误:', error);
    
    // 生产环境直接抛出错误，不降级
    if (isProduction) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
    
    // 开发环境可以降级
    console.warn('⚠️ 开发环境：数据库连接失败，降级到内存存储');
    return simulateQuery(sql, params);
  }
}

// 执行单条查询
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// 执行插入并返回ID
async function insert(sql, params = []) {
  try {
    if (hasDbConfig) {
      const connection = initializePool();
      const [result] = await connection.execute(sql, params);
      return result.insertId;
    } else {
      if (isProduction) {
        throw new Error('生产环境必须配置数据库连接');
      }
      console.warn('⚠️ 开发环境：使用内存存储');
      return simulateInsert(sql, params);
    }
  } catch (error) {
    console.error('数据库插入错误:', error);
    
    if (isProduction) {
      throw new Error(`数据库操作失败: ${error.message}`);
    }
    
    console.warn('⚠️ 开发环境：降级到内存存储');
    return simulateInsert(sql, params);
  }
}

// 执行更新
async function update(sql, params = []) {
  try {
    if (hasDbConfig) {
      const connection = initializePool();
      const [result] = await connection.execute(sql, params);
      return result.affectedRows;
    } else {
      if (isProduction) {
        throw new Error('生产环境必须配置数据库连接');
      }
      return simulateUpdate(sql, params);
    }
  } catch (error) {
    console.error('数据库更新错误:', error);
    
    if (isProduction) {
      throw new Error(`数据库操作失败: ${error.message}`);
    }
    
    return simulateUpdate(sql, params);
  }
}

// 模拟查询（仅开发环境）
function simulateQuery(sql, params) {
  console.log('🔧 开发环境模拟查询:', sql, params);
  
  if (sql.includes('FROM sales')) {
    if (sql.includes('WHERE link_code')) {
      const linkCode = params[0];
      return memoryStore.sales.filter(s => s.link_code === linkCode);
    }
    if (sql.includes('COUNT(*)')) {
      return [{ count: memoryStore.sales.length }];
    }
    return memoryStore.sales;
  }
  
  return [];
}

// 模拟插入（仅开发环境）
function simulateInsert(sql, params) {
  console.log('🔧 开发环境模拟插入:', sql, params);
  
  if (sql.includes('INSERT INTO sales')) {
    const id = memoryStore.counter++;
    const now = new Date().toISOString();
    const newSales = {
      id,
      wechat_name: params[0],
      payment_method: params[1],
      payment_address: params[2],
      alipay_surname: params[3],
      chain_name: params[4],
      link_code: params[5],
      created_at: now,
      updated_at: now
    };
    memoryStore.sales.push(newSales);
    return id;
  }
  
  return memoryStore.counter++;
}

// 模拟更新（仅开发环境）
function simulateUpdate(sql, params) {
  console.log('🔧 开发环境模拟更新:', sql, params);
  return 1;
}

// 事务执行
async function transaction(callback) {
  if (hasDbConfig) {
    const connection = await initializePool().getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } else {
    if (isProduction) {
      throw new Error('生产环境必须配置数据库连接');
    }
    return await callback(null);
  }
}

// 关闭连接池
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    if (hasDbConfig) {
      const result = await query('SELECT 1 as test');
      return result.length > 0;
    } else {
      if (isProduction) {
        return false; // 生产环境没有数据库配置是失败
      }
      return true; // 开发环境内存存储可用
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

// 获取当前存储状态
function getStorageStatus() {
  return {
    hasDbConfig,
    isProduction,
    currentStorage: hasDbConfig ? 'database' : (isProduction ? 'none' : 'memory')
  };
}

module.exports = {
  query,
  queryOne,
  insert,
  update,
  transaction,
  closePool,
  testConnection,
  getStorageStatus
}; 