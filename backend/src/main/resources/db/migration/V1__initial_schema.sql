
-- V1: Initial Neirah CRM database schema
-- For fresh database installations only.

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    email VARCHAR(150) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('MANAGER', 'SALES_REP') NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY UK6dotkott2kjsp8vw4d0m25fb7 (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE leads (
    id BIGINT NOT NULL AUTO_INCREMENT,
    company VARCHAR(150) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL,
    deal_value DECIMAL(12,2) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    email_normalized VARCHAR(150) DEFAULT NULL,
    loss_reason VARCHAR(500) DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    phone_normalized VARCHAR(30) DEFAULT NULL,
    priority ENUM('HIGH','LOW','MEDIUM') NOT NULL,
    source VARCHAR(50) DEFAULT NULL,
    status ENUM('CONTACTED','LOST','NEW','PROPOSAL_SENT','QUALIFIED','WON') NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    version BIGINT DEFAULT NULL,
    created_by BIGINT NOT NULL,
    owner_id BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_lead_email_normalized (email_normalized),
    KEY idx_lead_phone_normalized (phone_normalized),
    KEY idx_lead_owner (owner_id),
    KEY idx_lead_status (status),
    KEY FK7psxmw20se1mq168v2c86gfyt (created_by),
    CONSTRAINT FK6atlkrs3i0qaviw1valk4cspd
        FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT FK7psxmw20se1mq168v2c86gfyt
        FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE activities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    type ENUM('CALL','MEETING','NOTE') NOT NULL,
    actor_id BIGINT NOT NULL,
    lead_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_activity_lead (lead_id),
    KEY idx_activity_created (created_at),
    KEY FKmfjrc8jdvy0yrr7x67qmrxkue (actor_id),
    CONSTRAINT FKf7dwdqdh5opaejcemm2r16t0m
        FOREIGN KEY (lead_id) REFERENCES leads (id),
    CONSTRAINT FKmfjrc8jdvy0yrr7x67qmrxkue
        FOREIGN KEY (actor_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_type ENUM('OWNER_CHANGED','STATUS_CHANGED') NOT NULL,
    new_value VARCHAR(500) DEFAULT NULL,
    occurred_at DATETIME(6) NOT NULL,
    old_value VARCHAR(500) DEFAULT NULL,
    actor_id BIGINT NOT NULL,
    lead_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_audit_lead (lead_id),
    KEY idx_audit_time (occurred_at),
    KEY FKf2uqqjmo7gvd8fq7ac81fgc0m (actor_id),
    CONSTRAINT FKf2uqqjmo7gvd8fq7ac81fgc0m
        FOREIGN KEY (actor_id) REFERENCES users (id),
    CONSTRAINT FKtepu7hgmlcjtpc2epsqwcxqug
        FOREIGN KEY (lead_id) REFERENCES leads (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    company VARCHAR(150) DEFAULT NULL,
    converted_at DATETIME(6) NOT NULL,
    email VARCHAR(150) DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    lead_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY UKmn7kbj4gv7prbredtkm3m8aac (lead_id),
    CONSTRAINT FKka6vo972x5m28w6k1ju1i1k0d
        FOREIGN KEY (lead_id) REFERENCES leads (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE follow_ups (
    id BIGINT NOT NULL AUTO_INCREMENT,
    completed_at DATETIME(6) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL,
    description VARCHAR(1000) DEFAULT NULL,
    due_at DATETIME(6) NOT NULL,
    title VARCHAR(150) NOT NULL,
    type ENUM('CALL','MEETING','TASK') NOT NULL,
    assigned_to BIGINT DEFAULT NULL,
    created_by BIGINT NOT NULL,
    lead_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_followup_lead (lead_id),
    KEY idx_followup_due (due_at),
    KEY idx_followup_assigned (assigned_to),
    KEY FK7b6i54p696395p87ec55sp3q4 (created_by),
    CONSTRAINT FK7b6i54p696395p87ec55sp3q4
        FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT FKanqh2lrhghex8k3dego9um3jh
        FOREIGN KEY (lead_id) REFERENCES leads (id),
    CONSTRAINT FKi0velk5b1dtl4tl11b6ptn6if
        FOREIGN KEY (assigned_to) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
