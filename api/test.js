export default function handler(req, res) {
  res.status(200).json({
    message: 'API部署测试成功',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  });
} 