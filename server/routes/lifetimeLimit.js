const express = require('express');
const { LifetimeLimit, Orders } = require('../models');
const router = express.Router();

// 获取永久授权限量信息
router.get('/info', async (req, res) => {
  try {
    const limitInfo = await LifetimeLimit.findOne({
      where: { is_active: true }
    });

    if (!limitInfo) {
      return res.status(404).json({
        success: false,
        message: '未找到永久授权限量配置'
      });
    }

    // 计算剩余可售数量
    const remainingCount = limitInfo.total_limit - limitInfo.sold_count;
    const isAvailable = remainingCount > 0;

    res.json({
      success: true,
      data: {
        total_limit: limitInfo.total_limit,
        sold_count: limitInfo.sold_count,
        remaining_count: remainingCount,
        is_available: isAvailable,
        is_active: limitInfo.is_active
      }
    });
  } catch (error) {
    console.error('获取永久授权限量信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取永久授权限量信息失败'
    });
  }
});

// 更新永久授权限量设置（管理员用）
router.put('/config', async (req, res) => {
  try {
    const { total_limit, is_active } = req.body;

    // 验证权限（这里可以添加管理员权限验证）
    // TODO: 添加管理员权限验证中间件

    const limitInfo = await LifetimeLimit.findOne({
      where: { is_active: true }
    });

    if (!limitInfo) {
      return res.status(404).json({
        success: false,
        message: '未找到永久授权限量配置'
      });
    }

    // 验证新的限量不能小于已售数量
    if (total_limit < limitInfo.sold_count) {
      return res.status(400).json({
        success: false,
        message: `新的限量不能小于已售数量（${limitInfo.sold_count}）`
      });
    }

    // 更新配置
    await limitInfo.update({
      total_limit: total_limit || limitInfo.total_limit,
      is_active: is_active !== undefined ? is_active : limitInfo.is_active
    });

    res.json({
      success: true,
      message: '永久授权限量配置更新成功',
      data: {
        total_limit: limitInfo.total_limit,
        sold_count: limitInfo.sold_count,
        remaining_count: limitInfo.total_limit - limitInfo.sold_count,
        is_active: limitInfo.is_active
      }
    });
  } catch (error) {
    console.error('更新永久授权限量配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新永久授权限量配置失败'
    });
  }
});

// 增加已售永久授权数量（订单确认时调用）
router.post('/increment', async (req, res) => {
  try {
    const limitInfo = await LifetimeLimit.findOne({
      where: { is_active: true }
    });

    if (!limitInfo) {
      return res.status(404).json({
        success: false,
        message: '未找到永久授权限量配置'
      });
    }

    // 检查是否还有剩余数量
    if (limitInfo.sold_count >= limitInfo.total_limit) {
      return res.status(400).json({
        success: false,
        message: '永久授权已售罄'
      });
    }

    // 增加已售数量
    await limitInfo.update({
      sold_count: limitInfo.sold_count + 1
    });

    res.json({
      success: true,
      message: '永久授权已售数量更新成功',
      data: {
        sold_count: limitInfo.sold_count,
        remaining_count: limitInfo.total_limit - limitInfo.sold_count
      }
    });
  } catch (error) {
    console.error('增加永久授权已售数量错误:', error);
    res.status(500).json({
      success: false,
      message: '增加永久授权已售数量失败'
    });
  }
});

// 减少已售永久授权数量（订单取消时调用）
router.post('/decrement', async (req, res) => {
  try {
    const limitInfo = await LifetimeLimit.findOne({
      where: { is_active: true }
    });

    if (!limitInfo) {
      return res.status(404).json({
        success: false,
        message: '未找到永久授权限量配置'
      });
    }

    // 检查已售数量是否大于0
    if (limitInfo.sold_count <= 0) {
      return res.status(400).json({
        success: false,
        message: '已售数量不能小于0'
      });
    }

    // 减少已售数量
    await limitInfo.update({
      sold_count: limitInfo.sold_count - 1
    });

    res.json({
      success: true,
      message: '永久授权已售数量更新成功',
      data: {
        sold_count: limitInfo.sold_count,
        remaining_count: limitInfo.total_limit - limitInfo.sold_count
      }
    });
  } catch (error) {
    console.error('减少永久授权已售数量错误:', error);
    res.status(500).json({
      success: false,
      message: '减少永久授权已售数量失败'
    });
  }
});

module.exports = router; 