-- 创建数据库
CREATE DATABASE IF NOT EXISTS bost_smis DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bost_smis;

-- 角色表
CREATE TABLE IF NOT EXISTS role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
  description TEXT COMMENT '角色描述',
  permissions TEXT COMMENT '权限JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='角色表';

-- 用户表
CREATE TABLE IF NOT EXISTS user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  role_id INT COMMENT '角色ID',
  is_active BOOLEAN DEFAULT true COMMENT '是否激活',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(id)
) COMMENT='用户表';

-- 备件分类表（树形结构）
CREATE TABLE IF NOT EXISTS category (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  parent_id INT DEFAULT 0 COMMENT '父分类ID，0表示顶级',
  code VARCHAR(50) COMMENT '分类编码',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_id (parent_id)
) COMMENT='备件分类表';

-- 备件信息表
CREATE TABLE IF NOT EXISTS spare_part (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '备件编码',
  name VARCHAR(100) NOT NULL COMMENT '备件名称',
  category_id INT COMMENT '分类ID',
  model VARCHAR(100) COMMENT '型号',
  specification TEXT COMMENT '规格',
  unit VARCHAR(20) COMMENT '单位',
  equipment_name VARCHAR(100) COMMENT '所属设备',
  image_url VARCHAR(255) COMMENT '图片地址',
  qr_code VARCHAR(255) COMMENT '二维码',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES category(id),
  INDEX idx_code (code),
  INDEX idx_category (category_id)
) COMMENT='备件信息表';

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  part_id INT NOT NULL COMMENT '备件ID',
  quantity INT DEFAULT 0 COMMENT '当前数量',
  safe_quantity INT DEFAULT 0 COMMENT '安全库存量',
  location VARCHAR(100) COMMENT '存放位置',
  last_check_time TIMESTAMP COMMENT '最近盘点时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES spare_part(id) ON DELETE CASCADE,
  UNIQUE KEY uk_part_id (part_id)
) COMMENT='库存表';

-- 供应商表
CREATE TABLE IF NOT EXISTS supplier (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '供应商名称',
  contact_person VARCHAR(50) COMMENT '联系人',
  phone VARCHAR(20) COMMENT '电话',
  email VARCHAR(50) COMMENT '邮箱',
  address TEXT COMMENT '地址',
  score DECIMAL(3,2) DEFAULT 5.0 COMMENT '评分',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) COMMENT='供应商表';

-- 采购订单表
CREATE TABLE IF NOT EXISTS purchase_order (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
  part_id INT NOT NULL COMMENT '备件ID',
  supplier_id INT COMMENT '供应商ID',
  quantity INT NOT NULL COMMENT '采购数量',
  unit_price DECIMAL(10,2) COMMENT '单价',
  total_amount DECIMAL(12,2) COMMENT '总金额',
  status ENUM('draft','pending','approved','ordered','shipped','received','cancelled') DEFAULT 'draft' COMMENT '状态',
  remark TEXT COMMENT '备注',
  created_by INT COMMENT '创建人',
  approved_by INT COMMENT '审批人',
  approved_at TIMESTAMP COMMENT '审批时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES spare_part(id),
  FOREIGN KEY (supplier_id) REFERENCES supplier(id),
  FOREIGN KEY (created_by) REFERENCES user(id),
  FOREIGN KEY (approved_by) REFERENCES user(id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status)
) COMMENT='采购订单表';

-- 出入库记录表
CREATE TABLE IF NOT EXISTS inventory_transaction (
  id INT PRIMARY KEY AUTO_INCREMENT,
  part_id INT NOT NULL COMMENT '备件ID',
  type ENUM('in','out') NOT NULL COMMENT '出入库类型',
  quantity INT NOT NULL COMMENT '数量',
  batch_no VARCHAR(50) COMMENT '批次号',
  transaction_type ENUM('purchase','transfer_in','transfer_out','usage','adjustment') COMMENT '业务类型',
  related_order_id INT COMMENT '关联订单ID',
  operator_id INT COMMENT '操作人',
  receiver_id INT COMMENT '领用人（出库时）',
  location VARCHAR(100) COMMENT '存放位置',
  transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间',
  remark TEXT COMMENT '备注',
  signature_url VARCHAR(255) COMMENT '电子签名地址',
  FOREIGN KEY (part_id) REFERENCES spare_part(id),
  FOREIGN KEY (operator_id) REFERENCES user(id),
  FOREIGN KEY (receiver_id) REFERENCES user(id),
  FOREIGN KEY (related_order_id) REFERENCES purchase_order(id),
  INDEX idx_part_id (part_id),
  INDEX idx_type (type),
  INDEX idx_transaction_time (transaction_time)
) COMMENT='出入库记录表';

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '用户ID',
  username VARCHAR(50) COMMENT '用户名',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success','failed') COMMENT '登录状态',
  FOREIGN KEY (user_id) REFERENCES user(id),
  INDEX idx_user_id (user_id),
  INDEX idx_login_time (login_time)
) COMMENT='登录日志表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '用户ID',
  module VARCHAR(50) COMMENT '模块',
  action VARCHAR(50) COMMENT '操作',
  target_id INT COMMENT '目标ID',
  description TEXT COMMENT '描述',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id),
  INDEX idx_user_id (user_id),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
) COMMENT='操作日志表';

-- 插入初始角色数据
INSERT INTO role (name, description, permissions) VALUES
('系统管理员', '拥有所有权限', '{"all": true}'),
('机务主管', '审核采购计划、查看全船备件库存、审批出入库申请、查看各类报表', '{"purchase":["approve","view"],"inventory":["view","export"],"transaction":["approve","view"],"report":["view","export"]}'),
('采购员', '管理供应商、发起采购申请、询价比价、跟踪订单状态', '{"supplier":["all"],"purchase":["create","update","view"],"report":["view"]}'),
('仓库管理员', '管理出入库记录、执行库存盘点、维护库存状态、触发补货预警', '{"inventory":["all"],"transaction":["all"],"sparePart":["view"]}'),
('普通船员', '查询备件信息、申请领用备件、查看个人领用记录', '{"sparePart":["view"],"transaction":["create","view_own"]}');

-- 插入初始管理员用户（密码：admin123）
INSERT INTO user (username, password, real_name, role_id) VALUES
('admin', '$2a$10$RENLk3CRb74LDkufWa0cDefRq0WjHbZmbS4v2Q77BmQGpauKvt/B.', '系统管理员', 1);

-- 插入示例分类数据
INSERT INTO category (name, parent_id, code, sort_order) VALUES
('动力系统', 0, 'POWER', 1),
('电气系统', 0, 'ELECTRIC', 2),
('机械系统', 0, 'MECHANICAL', 3),
('发动机', 1, 'POWER-ENGINE', 1),
('发电机', 1, 'POWER-GENERATOR', 2),
('电机', 2, 'ELECTRIC-MOTOR', 1),
('电缆', 2, 'ELECTRIC-CABLE', 2),
('泵类', 3, 'MECHANICAL-PUMP', 1),
('阀门', 3, 'MECHANICAL-VALVE', 2);

-- 插入测试用户数据
INSERT INTO user (username, password, real_name, role_id, is_active) VALUES
('captain', '$2a$10$RENLk3CRb74LDkufWa0cDefRq0WjHbZmbS4v2Q77BmQGpauKvt/B.', '李船长', 2, true),
('purchaser', '$2a$10$RENLk3CRb74LDkufWa0cDefRq0WjHbZmbS4v2Q77BmQGpauKvt/B.', '张采购', 3, true),
('warehouse', '$2a$10$RENLk3CRb74LDkufWa0cDefRq0WjHbZmbS4v2Q77BmQGpauKvt/B.', '王仓管', 4, true),
('crew', '$2a$10$RENLk3CRb74LDkufWa0cDefRq0WjHbZmbS4v2Q77BmQGpauKvt/B.', '赵船员', 5, true);

-- 插入测试备件数据
INSERT INTO spare_part (code, name, category_id, model, specification, unit, equipment_name, image_url, qr_code) VALUES
('SP001', '柴油发动机缸套', 4, 'MAN B&W 6S50MC', '缸套直径: 500mm, 高度: 800mm', '个', '主推进发动机', '/images/cylinder_sleeve.jpg', 'SP001'),
('SP002', '涡轮增压器', 4, 'Garrett Marine T300', '增压比: 2.5:1, 流量: 1500m³/h', '个', '主推进发动机', '/images/turbocharger.jpg', 'SP002'),
('SP003', '发电机轴承', 5, 'SKF 6315-2RS', '内径: 75mm, 外径: 160mm, 宽度: 37mm', '套', '发电机组', '/images/bearing.jpg', 'SP003'),
('SP004', '三相异步电机', 6, 'ABB M2BAX 200LA4', '功率: 30kW, 转速: 1450rpm', '台', '主甲板机械', '/images/motor.jpg', 'SP004'),
('SP005', '船舶专用电缆', 7, 'H07Z-K 3x2.5mm²', '铜芯, 3芯, 2.5mm²截面', '米', '全船电力系统', '/images/cable.jpg', 'SP005'),
('SP006', '离心泵', 8, 'KSB HGM 150-400', '流量: 200m³/h, 扬程: 40m', '台', '冷却水系统', '/images/centrifugal_pump.jpg', 'SP006'),
('SP007', '球阀', 9, 'KITZ BF50-150', 'DN50-DN150, 压力等级: 16bar', '个', '管路系统', '/images/ball_valve.jpg', 'SP007'),
('SP008', '空气滤清器', 4, 'Donaldson P550018', '过滤效率: 99.9%, 流量: 1200L/min', '个', '主推进发动机', '/images/air_filter.jpg', 'SP008'),
('SP009', '燃油滤清器', 4, 'Cummins FS1415', '过滤精度: 10μm', '个', '燃油系统', '/images/fuel_filter.jpg', 'SP009'),
('SP010', '液压油', 3, 'Shell Tellus S4 VX 46', '粘度: 46cSt, 5L装', '桶', '液压系统', '/images/hydraulic_oil.jpg', 'SP010');

-- 插入测试库存数据
INSERT INTO inventory (part_id, quantity, safe_quantity, location) VALUES
(1, 3, 2, 'A区-01'),
(2, 2, 1, 'A区-02'),
(3, 5, 3, 'B区-01'),
(4, 4, 2, 'B区-03'),
(5, 200, 100, 'C区-01'),
(6, 2, 1, 'A区-04'),
(7, 10, 5, 'A区-05'),
(8, 8, 3, 'A区-06'),
(9, 15, 5, 'A区-07'),
(10, 12, 6, 'C区-02');

-- 插入测试供应商数据
INSERT INTO supplier (name, contact_person, phone, email, address, score, status) VALUES
('海事设备有限公司', '刘经理', '13800138001', 'liu@marine.com', '上海市浦东新区临港新片区海洋一路88号', 4.8, 'active'),
('船舶配件供应商', '张总', '13900139002', 'zhang@ship.com', '大连市中山区港湾街15号', 4.6, 'active'),
('国际船用设备公司', '王总监', '13700137003', 'wang@marineequip.com', '青岛市市南区香港中路100号', 4.9, 'active'),
('机电设备贸易公司', '李经理', '13600136004', 'li@mech.com', '广州市南沙区港前路55号', 4.5, 'active'),
('船舶维修服务公司', '陈总', '13500135005', 'chen@repair.com', '深圳市南山区蛇口港湾大道12号', 4.3, 'active');

-- 插入测试采购订单数据
INSERT INTO purchase_order (order_no, part_id, supplier_id, quantity, unit_price, total_amount, status, remark, created_by, approved_by, approved_at) VALUES
('PO202312001', 1, 1, 2, 15000.00, 30000.00, 'approved', '主推进发动机缸套备件', 3, 2, '2023-12-01 10:30:00'),
('PO202312002', 3, 2, 3, 2500.00, 7500.00, 'ordered', '发电机轴承备件', 3, 2, '2023-12-02 14:20:00'),
('PO202312003', 5, 3, 100, 15.00, 1500.00, 'received', '船舶电缆采购', 3, 2, '2023-12-03 09:15:00'),
('PO202312004', 7, 4, 5, 800.00, 4000.00, 'pending', '管路系统球阀', 3, NULL, NULL),
('PO202312005', 10, 5, 10, 200.00, 2000.00, 'shipped', '液压油采购', 3, 2, '2023-12-04 16:45:00');

-- 插入测试出入库记录数据
INSERT INTO inventory_transaction (part_id, type, quantity, batch_no, transaction_type, related_order_id, operator_id, receiver_id, location, transaction_time, remark) VALUES
(1, 'in', 5, 'BATCH-2023-001', 'purchase', 1, 3, NULL, 'A区-01', '2023-12-01 11:00:00', '采购入库'),
(3, 'in', 8, 'BATCH-2023-002', 'purchase', 2, 3, NULL, 'B区-01', '2023-12-02 15:00:00', '采购入库'),
(5, 'in', 100, 'BATCH-2023-003', 'purchase', 3, 3, NULL, 'C区-01', '2023-12-03 10:00:00', '采购入库'),
(5, 'out', 30, 'BATCH-2023-003', 'usage', NULL, 4, 5, 'C区-01', '2023-12-03 14:30:00', '机务维修领用'),
(7, 'in', 5, 'BATCH-2023-004', 'purchase', 4, 3, NULL, 'A区-05', '2023-12-05 09:00:00', '采购入库'),
(4, 'out', 1, 'BATCH-2023-002', 'usage', NULL, 4, 5, 'B区-03', '2023-12-06 13:20:00', '更换电机'),
(10, 'in', 10, 'BATCH-2023-005', 'purchase', 5, 3, NULL, 'C区-02', '2023-12-07 11:15:00', '采购入库');

-- 插入测试登录日志数据
INSERT INTO login_log (user_id, username, ip_address, login_time, status) VALUES
(1, 'admin', '192.168.1.100', '2023-12-01 08:30:00', 'success'),
(2, 'captain', '192.168.1.101', '2023-12-01 08:35:00', 'success'),
(3, 'purchaser', '192.168.1.102', '2023-12-01 08:40:00', 'success'),
(4, 'warehouse', '192.168.1.103', '2023-12-01 08:45:00', 'success'),
(5, 'crew', '192.168.1.104', '2023-12-01 08:50:00', 'success');

-- 插入测试操作日志数据
INSERT INTO operation_log (user_id, module, action, target_id, description, ip_address, created_at) VALUES
(1, 'user', 'create', 6, '创建新用户', '192.168.1.100', '2023-12-01 09:00:00'),
(2, 'inventory', 'view', NULL, '查看库存报表', '192.168.1.101', '2023-12-01 09:15:00'),
(3, 'purchase', 'create', 6, '创建采购订单', '192.168.1.102', '2023-12-01 10:00:00'),
(4, 'transaction', 'create', 7, '创建出入库记录', '192.168.1.103', '2023-12-01 10:30:00'),
(5, 'sparePart', 'view', 1, '查看备件信息', '192.168.1.104', '2023-12-01 11:00:00');

-- 创建视图：库存不足预警视图
CREATE VIEW inventory_low_warning AS
SELECT 
    sp.id AS part_id,
    sp.code AS part_code,
    sp.name AS part_name,
    sp.model,
    sp.unit,
    i.quantity,
    i.safe_quantity,
    c.name AS category_name,
    s.name AS supplier_name
FROM inventory i
JOIN spare_part sp ON i.part_id = sp.id
JOIN category c ON sp.category_id = c.id
LEFT JOIN purchase_order po ON sp.id = po.part_id AND po.status IN ('draft', 'pending', 'approved')
LEFT JOIN supplier s ON po.supplier_id = s.id
WHERE i.quantity <= i.safe_quantity;

-- 创建视图：备件出入库汇总视图
CREATE VIEW part_transaction_summary AS
SELECT 
    sp.id AS part_id,
    sp.code AS part_code,
    sp.name AS part_name,
    sp.model,
    sp.unit,
    c.name AS category_name,
    SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE 0 END) AS total_in,
    SUM(CASE WHEN it.type = 'out' THEN it.quantity ELSE 0 END) AS total_out,
    SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE -it.quantity END) AS net_change,
    i.quantity AS current_stock
FROM spare_part sp
JOIN category c ON sp.category_id = c.id
LEFT JOIN inventory_transaction it ON sp.id = it.part_id
LEFT JOIN inventory i ON sp.id = i.part_id
GROUP BY sp.id, sp.code, sp.name, sp.model, sp.unit, c.name, i.quantity;

-- 创建视图：供应商采购统计视图
CREATE VIEW supplier_purchase_stats AS
SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.contact_person,
    s.phone,
    s.email,
    s.score,
    COUNT(po.id) AS total_orders,
    COALESCE(SUM(po.total_amount), 0) AS total_amount,
    AVG(s.score) AS avg_score
FROM supplier s
LEFT JOIN purchase_order po ON s.id = po.supplier_id
GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.score;

-- 创建触发器：在库存表中更新备件数量时，同步更新库存记录
DELIMITER $$

-- 采购订单状态变更时更新库存触发器
CREATE TRIGGER update_inventory_after_purchase_receive
AFTER UPDATE ON purchase_order
FOR EACH ROW
BEGIN
    -- 如果订单状态从非received变为received（采购完成）
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        -- 检查库存表中是否已存在该备件记录
        IF EXISTS(SELECT 1 FROM inventory WHERE part_id = NEW.part_id) THEN
            -- 更新现有库存数量
            UPDATE inventory 
            SET quantity = quantity + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE part_id = NEW.part_id;
        ELSE
            -- 插入新的库存记录
            INSERT INTO inventory (part_id, quantity, safe_quantity, location, updated_at)
            VALUES (NEW.part_id, NEW.quantity, 0, '待分配', CURRENT_TIMESTAMP);
        END IF;
    END IF;
END$$

-- 出入库记录插入后更新库存触发器
CREATE TRIGGER update_inventory_after_transaction
AFTER INSERT ON inventory_transaction
FOR EACH ROW
BEGIN
    -- 根据出入库类型更新库存数量
    IF NEW.type = 'in' THEN
        -- 入库：增加库存
        UPDATE inventory 
        SET quantity = quantity + NEW.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE part_id = NEW.part_id;
    ELSEIF NEW.type = 'out' THEN
        -- 出库：减少库存
        UPDATE inventory 
        SET quantity = quantity - NEW.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE part_id = NEW.part_id;
    END IF;
END$$

-- 库存更新前检查触发器
CREATE TRIGGER check_inventory_before_update
BEFORE UPDATE ON inventory
FOR EACH ROW
BEGIN
    -- 确保库存数量不能为负数
    IF NEW.quantity < 0 THEN
        SET NEW.quantity = 0;
    END IF;
END$$

DELIMITER ;