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

-- NOVAS TABELAS PARA GESTÃO DE PERFIS --
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
