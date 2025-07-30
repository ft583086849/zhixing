// Vercel Serverless Function - 永久授权限量API
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 数据库连接配置
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

// 验证管理员token
async function authenticateAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('未提供认证token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  return decoded;
}

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { action } = req.query;

    if (req.method === 'GET') {
      await handleGetLimitInfo(req, res, connection);
    } else if (req.method === 'PUT') {
      // 需要管理员权限
      await authenticateAdmin(req);
      await handleUpdateConfig(req, res, connection);
    } else if (req.method === 'POST' && action === 'increment') {
      await handleIncrementSold(req, res, connection);
    } else if (req.method === 'POST' && action === 'decrement') {
      // 需要管理员权限
      await authenticateAdmin(req);
      await handleDecrementSold(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${action || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('永久授权限量API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
};

// 获取限量信息
async function handleGetLimitInfo(req, res, connection) {
  const [rows] = await connection.execute(
    'SELECT * FROM lifetime_limit ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    // 如果没有配置，创建默认配置
    await connection.execute(
      'INSERT INTO lifetime_limit (total_limit, used_count, is_active) VALUES (100, 0, TRUE)'
    );

    return res.json({
      success: true,
      data: {
        total_limit: 100,
        used_count: 0,
        remaining_count: 100,
        is_active: true
      }
    });
  }

  const config = rows[0];
  const remainingCount = config.total_limit - config.used_count;

  res.json({
    success: true,
    data: {
      ...config,
      remaining_count: remainingCount
    }
  });
}

// 更新配置
async function handleUpdateConfig(req, res, connection) {
  const { total_limit, is_active } = req.body;

  if (total_limit !== undefined && total_limit < 0) {
    return res.status(400).json({
      success: false,
      message: '总限量不能小于0'
    });
  }

  // 检查是否已有配置
  const [existingRows] = await connection.execute(
    'SELECT * FROM lifetime_limit ORDER BY id DESC LIMIT 1'
  );

  if (existingRows.length > 0) {
    const updateFields = [];
    const updateValues = [];

    if (total_limit !== undefined) {
      updateFields.push('total_limit = ?');
      updateValues.push(total_limit);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(existingRows[0].id);

      await connection.execute(
        `UPDATE lifetime_limit SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
  } else {
    // 创建新配置
    await connection.execute(
      'INSERT INTO lifetime_limit (total_limit, used_count, is_active) VALUES (?, 0, ?)',
      [total_limit || 100, is_active !== undefined ? is_active : true]
    );
  }

  res.json({
    success: true,
    message: '配置更新成功'
  });
}

// 增加已售数量
async function handleIncrementSold(req, res, connection) {
  // 检查是否还有剩余
  const [rows] = await connection.execute(
    'SELECT * FROM lifetime_limit WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: '未找到活跃的限量配置'
    });
  }

  const config = rows[0];
  const remainingCount = config.total_limit - config.used_count;

  if (remainingCount <= 0) {
    return res.status(400).json({
      success: false,
      message: '永久授权已售完'
    });
  }

  await connection.execute(
    'UPDATE lifetime_limit SET used_count = used_count + 1, updated_at = NOW() WHERE id = ?',
    [config.id]
  );

  res.json({
    success: true,
    message: '已售数量增加成功',
    data: {
      remaining_count: remainingCount - 1
    }
  });
}

// 减少已售数量（管理员功能）
async function handleDecrementSold(req, res, connection) {
  const [rows] = await connection.execute(
    'SELECT * FROM lifetime_limit ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: '未找到限量配置'
    });
  }

  const config = rows[0];

  if (config.used_count <= 0) {
    return res.status(400).json({
      success: false,
      message: '已售数量不能小于0'
    });
  }

  await connection.execute(
    'UPDATE lifetime_limit SET used_count = used_count - 1, updated_at = NOW() WHERE id = ?',
    [config.id]
  );

  const remainingCount = config.total_limit - (config.used_count - 1);

  res.json({
    success: true,
    message: '已售数量减少成功',
    data: {
      remaining_count: remainingCount
    }
  });
}