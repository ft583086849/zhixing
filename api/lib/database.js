// Vercel 临时数据库服务 - 使用内存存储
const mysql = require('mysql2/promise');

// 内存存储（临时解决方案）
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
      // 使用内存存储
      return simulateQuery(sql, params);
    }
  } catch (error) {
    console.error('数据库查询错误:', error);
    // 如果数据库连接失败，降级到内存存储
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
      return simulateInsert(sql, params);
    }
  } catch (error) {
    console.error('数据库插入错误:', error);
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
      return simulateUpdate(sql, params);
    }
  } catch (error) {
    console.error('数据库更新错误:', error);
    return simulateUpdate(sql, params);
  }
}

// 模拟查询
function simulateQuery(sql, params) {
  console.log('使用内存存储模拟查询:', sql, params);
  
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

// 模拟插入
function simulateInsert(sql, params) {
  console.log('使用内存存储模拟插入:', sql, params);
  
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

// 模拟更新
function simulateUpdate(sql, params) {
  console.log('使用内存存储模拟更新:', sql, params);
  return 1; // 返回影响的行数
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
    // 模拟事务
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
      return true; // 内存存储总是可用
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

module.exports = {
  query,
  queryOne,
  insert,
  update,
  transaction,
  closePool,
  testConnection
}; 