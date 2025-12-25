const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const XLSX = require('xlsx');

// 库存报表
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const { export: exportType, low_stock } = req.query;

    let sql = `
      SELECT i.*, sp.code, sp.name, sp.model, sp.unit, sp.category_id, c.name as category_name,
             CASE WHEN i.quantity <= i.safe_quantity AND i.safe_quantity > 0 THEN 1 ELSE 0 END as is_low_stock
      FROM inventory i
      INNER JOIN spare_part sp ON i.part_id = sp.id
      LEFT JOIN category c ON sp.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (low_stock === 'true') {
      sql += ' AND i.quantity <= i.safe_quantity AND i.safe_quantity > 0';
    }

    sql += ' ORDER BY is_low_stock DESC, sp.name';

    const [inventory] = await pool.execute(sql, params);

    if (exportType === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        inventory.map(item => ({
          '备件编码': item.code,
          '备件名称': item.name,
          '型号': item.model || '',
          '单位': item.unit || '',
          '分类': item.category_name || '',
          '当前库存': item.quantity,
          '安全库存': item.safe_quantity,
          '存放位置': item.location || '',
          '是否低库存': item.is_low_stock ? '是' : '否',
          '最近盘点时间': item.last_check_time || ''
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '库存报表');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=库存报表.xlsx');
      return res.send(buffer);
    }

    res.json({ code: 200, data: inventory });
  } catch (error) {
    console.error('获取库存报表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 采购报表
router.get('/purchase', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, supplier_id, export: exportType } = req.query;

    let sql = `
      SELECT po.*, sp.code as part_code, sp.name as part_name, sp.model, sp.unit,
             s.name as supplier_name, u1.real_name as creator_name, u2.real_name as approver_name
      FROM purchase_order po
      LEFT JOIN spare_part sp ON po.part_id = sp.id
      LEFT JOIN supplier s ON po.supplier_id = s.id
      LEFT JOIN user u1 ON po.created_by = u1.id
      LEFT JOIN user u2 ON po.approved_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND DATE(po.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(po.created_at) <= ?';
      params.push(end_date);
    }
    if (supplier_id) {
      sql += ' AND po.supplier_id = ?';
      params.push(supplier_id);
    }

    sql += ' ORDER BY po.created_at DESC';

    const [orders] = await pool.execute(sql, params);

    // 统计信息
    const statistics = {
      total_orders: orders.length,
      total_amount: orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
      total_quantity: orders.reduce((sum, order) => sum + (order.quantity || 0), 0),
      by_status: {}
    };

    orders.forEach(order => {
      const status = order.status;
      if (!statistics.by_status[status]) {
        statistics.by_status[status] = { count: 0, amount: 0 };
      }
      statistics.by_status[status].count++;
      statistics.by_status[status].amount += parseFloat(order.total_amount) || 0;
    });

    if (exportType === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        orders.map(item => ({
          '订单号': item.order_no,
          '备件编码': item.part_code,
          '备件名称': item.part_name,
          '型号': item.model || '',
          '供应商': item.supplier_name || '',
          '数量': item.quantity,
          '单价': item.unit_price,
          '总金额': item.total_amount,
          '状态': getStatusText(item.status),
          '创建人': item.creator_name || '',
          '审批人': item.approver_name || '',
          '创建时间': item.created_at
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '采购报表');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=采购报表.xlsx');
      return res.send(buffer);
    }

    res.json({ code: 200, data: { list: orders, statistics } });
  } catch (error) {
    console.error('获取采购报表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 出入库流水报表
router.get('/transaction', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, type, part_id, export: exportType } = req.query;

    let sql = `
      SELECT it.*, sp.code as part_code, sp.name as part_name, sp.model, sp.unit,
             u1.real_name as operator_name, u2.real_name as receiver_name
      FROM inventory_transaction it
      INNER JOIN spare_part sp ON it.part_id = sp.id
      LEFT JOIN user u1 ON it.operator_id = u1.id
      LEFT JOIN user u2 ON it.receiver_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND DATE(it.transaction_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(it.transaction_time) <= ?';
      params.push(end_date);
    }
    if (type) {
      sql += ' AND it.type = ?';
      params.push(type);
    }
    if (part_id) {
      sql += ' AND it.part_id = ?';
      params.push(part_id);
    }

    sql += ' ORDER BY it.transaction_time DESC';

    const [transactions] = await pool.execute(sql, params);

    if (exportType === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        transactions.map(item => ({
          '备件编码': item.part_code,
          '备件名称': item.part_name,
          '型号': item.model || '',
          '类型': item.type === 'in' ? '入库' : '出库',
          '业务类型': getTransactionTypeText(item.transaction_type),
          '数量': item.quantity,
          '批次号': item.batch_no || '',
          '操作人': item.operator_name || '',
          '领用人': item.receiver_name || '',
          '存放位置': item.location || '',
          '交易时间': item.transaction_time,
          '备注': item.remark || ''
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '出入库流水');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=出入库流水.xlsx');
      return res.send(buffer);
    }

    res.json({ code: 200, data: transactions });
  } catch (error) {
    console.error('获取出入库流水报表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 备件使用频率分析
router.get('/usage-frequency', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;

    let sql = `
      SELECT sp.id, sp.code, sp.name, sp.model, sp.unit,
             COUNT(it.id) as usage_count,
             SUM(CASE WHEN it.type = 'out' THEN it.quantity ELSE 0 END) as total_out_quantity
      FROM spare_part sp
      LEFT JOIN inventory_transaction it ON sp.id = it.part_id AND it.type = 'out'
    `;
    const params = [];
    const joinConditions = [];

    if (start_date) {
      joinConditions.push('DATE(it.transaction_time) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      joinConditions.push('DATE(it.transaction_time) <= ?');
      params.push(end_date);
    }
    
    if (joinConditions.length > 0) {
      sql = sql.replace('LEFT JOIN inventory_transaction it ON sp.id = it.part_id AND it.type = \'out\'',
        `LEFT JOIN inventory_transaction it ON sp.id = it.part_id AND it.type = 'out' AND ${joinConditions.join(' AND ')}`);
    }

    sql += `
      GROUP BY sp.id, sp.code, sp.name, sp.model, sp.unit
      HAVING usage_count > 0
      ORDER BY usage_count DESC, total_out_quantity DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [results] = await pool.execute(sql, params);

    res.json({ code: 200, data: results });
  } catch (error) {
    console.error('获取使用频率分析错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 供应商对比报表
router.get('/supplier-comparison', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let sql = `
      SELECT s.id, s.name, s.contact_person, s.phone,
             COUNT(po.id) as order_count,
             SUM(po.total_amount) as total_amount,
             AVG(po.unit_price) as avg_price,
             s.score
      FROM supplier s
      LEFT JOIN purchase_order po ON s.id = po.supplier_id
    `;
    const params = [];
    const joinConditions = [];

    if (start_date) {
      joinConditions.push('DATE(po.created_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      joinConditions.push('DATE(po.created_at) <= ?');
      params.push(end_date);
    }
    
    if (joinConditions.length > 0) {
      sql = sql.replace('LEFT JOIN purchase_order po ON s.id = po.supplier_id',
        `LEFT JOIN purchase_order po ON s.id = po.supplier_id AND ${joinConditions.join(' AND ')}`);
    }

    sql += `
      GROUP BY s.id, s.name, s.contact_person, s.phone, s.score
      HAVING order_count > 0
      ORDER BY total_amount DESC
    `;

    const [results] = await pool.execute(sql, params);

    res.json({ code: 200, data: results });
  } catch (error) {
    console.error('获取供应商对比报表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 辅助函数
function getStatusText(status) {
  const statusMap = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已审批',
    'ordered': '已下单',
    'shipped': '已发货',
    'received': '已入库',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

function getTransactionTypeText(type) {
  const typeMap = {
    'purchase': '采购入库',
    'transfer_in': '调拨入库',
    'transfer_out': '调拨出库',
    'usage': '领用出库',
    'adjustment': '库存调整'
  };
  return typeMap[type] || type;
}

module.exports = router;

