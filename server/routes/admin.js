const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

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

// 获取管理员概览数据
router.get('/overview', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 获取总订单数
    const [totalOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders'
    );

    // 获取待处理订单数
    const [pendingOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders WHERE status = "pending"'
    );

    // 获取已完成订单数
    const [completedOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders WHERE status = "completed"'
    );

    // 获取总销售额
    const [totalSales] = await connection.execute(
      'SELECT SUM(amount) as total FROM orders WHERE status = "completed"'
    );

    // 获取总佣金
    const [totalCommission] = await connection.execute(
      'SELECT SUM(commission_amount) as total FROM orders WHERE status = "completed"'
    );

    await connection.end();

    res.json({
      success: true,
      overview: {
        totalOrders: totalOrders[0].total || 0,
        pendingOrders: pendingOrders[0].total || 0,
        completedOrders: completedOrders[0].total || 0,
        totalSales: totalSales[0].total || 0,
        totalCommission: totalCommission[0].total || 0
      }
    });

  } catch (error) {
    console.error('获取管理员概览错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取客户列表
router.get('/customers', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT DISTINCT tradingview_username, wechat_id, COUNT(*) as order_count, SUM(amount) as total_spent FROM orders GROUP BY tradingview_username, wechat_id ORDER BY total_spent DESC'
    );

    await connection.end();

    res.json({
      success: true,
      customers: rows
    });

  } catch (error) {
    console.error('获取客户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 