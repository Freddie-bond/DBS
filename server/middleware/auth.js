const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-token'];
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, 'your-super-secret-jwt-key-change-in-production-which-is-long-enough-for-security');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '认证令牌已过期' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 401, message: '无效的认证令牌' });
    }
    return res.status(401).json({ code: 401, message: '认证令牌验证失败' });
  }
};

module.exports = authMiddleware;