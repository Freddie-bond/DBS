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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

