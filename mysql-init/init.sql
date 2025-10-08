CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(128),
    balance_cents INT NOT NULL DEFAULT 0,
    google_sso_id VARCHAR(255) UNIQUE,
    INDEX (email),
    INDEX (whatsapp_number)
);

CREATE TABLE IF NOT EXISTS back_office_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (email)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(120),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    INDEX(user_email),
    INDEX(timestamp)
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Ex: CAN_VIEW_USERS, CAN_DELETE_USERS'
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    rg VARCHAR(20) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    account_number VARCHAR(10) NOT NULL UNIQUE,
    branch VARCHAR(4) NOT NULL DEFAULT '0001',
    balance_cents INT NOT NULL DEFAULT 0,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (cpf),
    INDEX (account_number)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255) NOT NULL,
    amount_cents INT NOT NULL COMMENT 'Positivo para créditos, Negativo para débitos',
    type VARCHAR(20) NOT NULL COMMENT 'ex: credit, debit, transfer',
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX(client_id, timestamp)
);

-- ================================================================= --
-- ================== SEED DATA (DADOS INICIAIS) =================== --
-- ================================================================= --

INSERT INTO permissions (name) VALUES
    ('CAN_MANAGE_USERS'),
    ('CAN_VIEW_AUDIT_LOGS'),
    ('CAN_MANAGE_PERMISSIONS'),
    ('CAN_MANAGE_CLIENTS'),
    ('CAN_VIEW_CUSTOMER_DATA'),
    ('CAN_RESET_CUSTOMER_PASSWORD'),
    ('CAN_RESET_CUSTOMER_BIOMETRICS'),
    ('CAN_SEND_DOCUMENTS')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO back_office_user (full_name, email, role) 
VALUES ('André Bernardino', 'andre.bernardino@contabilizei.com.br', 'Admin') 
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO role_permissions (role_name, permission_id) VALUES
    ('Operator', (SELECT id FROM permissions WHERE name = 'CAN_VIEW_AUDIT_LOGS')),
    ('Operator', (SELECT id FROM permissions WHERE name = 'CAN_MANAGE_CLIENTS')),
    ('Operator', (SELECT id FROM permissions WHERE name = 'CAN_VIEW_CUSTOMER_DATA')),
    ('Operator', (SELECT id FROM permissions WHERE name = 'CAN_RESET_CUSTOMER_PASSWORD')),
    ('Operator', (SELECT id FROM permissions WHERE name = 'CAN_RESET_CUSTOMER_BIOMETRICS'))
ON DUPLICATE KEY UPDATE role_name=role_name;
