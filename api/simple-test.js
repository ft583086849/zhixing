export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: '简单API测试成功',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
} 