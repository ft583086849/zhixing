const express = require('express');
const { queryCache } = require('../config/dbOptimization');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Orders, Links, Sales, LifetimeLimit } = require('../models');
const { calculateExpiryTime, getCurrentTime } = require('../utils/dateUtils');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPG, PNG, GIF, WebP 格式的图片'));
    }
  }
});

// 创建订单
router.post('/create', upload.single('screenshot'), async (req, res) => {
  try {
    const {
      link_code,
      tradingview_username,
      duration,
      payment_method,
      payment_time,
      purchase_type = 'immediate',
      effective_time
    } = req.body;

    // 验证必填字段
    if (!link_code || !tradingview_username || !duration || !payment_method || !payment_time) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必填的'
      });
    }

    // 验证购买方式
    if (!['immediate', 'advance'].includes(purchase_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的购买方式'
      });
    }

    // 验证提前购买时的生效时间
    if (purchase_type === 'advance' && !effective_time) {
      return res.status(400).json({
        success: false,
        message: '提前购买需要指定生效时间'
      });
    }

    // 验证时长选项
    const validDurations = ['7days', '1month', '3months', '6months', '1year', 'lifetime'];
    if (!validDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        message: '无效的时长选项'
      });
    }

    // 验证付款方式
    if (!['alipay', 'crypto'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: '无效的付款方式'
      });
    }

    // 验证付款时间
    const paymentDate = new Date(payment_time);
    const now = new Date();
    if (paymentDate > now) {
      return res.status(400).json({
        success: false,
        message: '付款时间不能晚于当前时间'
      });
    }

    // 查找链接
    const link = await Links.findOne({
      where: { link_code },
      include: [{
        model: Sales,
        as: 'sales'
      }]
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: '链接不存在'
      });
    }

    // 如果是永久授权，检查限量
    if (duration === 'lifetime') {
      const limitInfo = await LifetimeLimit.findOne({
        where: { is_active: true }
      });

      if (!limitInfo) {
        return res.status(400).json({
          success: false,
          message: '永久授权限量配置未找到'
        });
      }

      if (limitInfo.sold_count >= limitInfo.total_limit) {
        return res.status(400).json({
          success: false,
          message: '永久授权已售罄，请选择其他时长'
        });
      }
    }

    // 计算金额
    const amountMap = {
      '7days': 0,
      '1month': 188,
      '3months': 488,
      '6months': 688,
      '1year': 1588,
      'lifetime': 1888
    };

    const amount = amountMap[duration];

    // 处理截图文件
    let screenshotPath = null;
    if (req.file) {
      screenshotPath = `/uploads/${req.file.filename}`;
    }

    // 计算生效时间和到期时间
    let effectiveTime, expiryTime;
    if (purchase_type === 'immediate') {
      effectiveTime = getCurrentTime();
    } else {
      effectiveTime = new Date(effective_time);
    }
    
    expiryTime = calculateExpiryTime(duration, effectiveTime);

    // 创建订单
    const order = await Orders.create({
      link_id: link.id,
      tradingview_username,
      duration,
      amount,
      payment_method,
      payment_time: paymentDate,
      purchase_type,
      effective_time: effectiveTime,
      expiry_time: expiryTime,
      submit_time: new Date(),
      screenshot_path: screenshotPath,
      status: 'pending_payment_confirmation'
    });

    res.json({
      success: true,
      message: '订单创建成功',
      data: {
        order_id: order.id,
        amount: order.amount,
        status: order.status
      }
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    
    // 如果是文件上传错误，删除已上传的文件
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('删除文件失败:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || '创建订单失败'
    });
  }
});

// 获取订单列表（管理员用）
router.get('/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      link_code,
      payment_method,
      status,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 构建查询条件
    if (link_code) {
      where['$links.link_code$'] = link_code;
    }
    if (payment_method) {
      where.payment_method = payment_method;
    }
    if (status) {
      where.status = status;
    }
    if (start_date && end_date) {
      where.submit_time = {
        [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const { count, rows } = await Orders.findAndCountAll({
      where,
      include: [{
        model: Links,
        as: 'links',
        include: [{
          model: Sales,
          as: 'sales'
        }]
      }],
      order: [['submit_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

// 更新订单状态（管理员用）
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const order = await Orders.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const oldStatus = order.status;
    await order.update({ status });

    // 如果是永久授权订单，处理限量逻辑
    if (order.duration === 'lifetime') {
      const limitInfo = await LifetimeLimit.findOne({
        where: { is_active: true }
      });

      if (limitInfo) {
        // 如果订单从非确认状态变为确认状态，增加已售数量
        if (oldStatus !== 'confirmed' && status === 'confirmed') {
          if (limitInfo.sold_count < limitInfo.total_limit) {
            await limitInfo.update({
              sold_count: limitInfo.sold_count + 1
            });
          }
        }
        // 如果订单从确认状态变为非确认状态，减少已售数量
        else if (oldStatus === 'confirmed' && status !== 'confirmed') {
          if (limitInfo.sold_count > 0) {
            await limitInfo.update({
              sold_count: limitInfo.sold_count - 1
            });
          }
        }
      }
    }

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: { status: order.status }
    });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    });
  }
});

module.exports = router; 