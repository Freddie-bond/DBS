const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传的图片等）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/spare-parts', require('./routes/spareParts'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

