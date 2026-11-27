-- V3: Logic fixes found in review.
--  * Conversion is recorded on the lead timeline (new CONVERTED audit event).
--  * One customer per real person: customers are matched on normalised email, and
--    several Won leads can point to the same customer (leads.customer_id).
--  * Password resets invalidate existing JWTs (users.token_version).
-- V1/V2 are left untouched so databases that already applied them keep valid checksums.

-- 1. New audit event type for conversions
ALTER TABLE audit_logs
    MODIFY COLUMN event_type ENUM('OWNER_CHANGED', 'STATUS_CHANGED', 'CONVERTED') NOT NULL;

-- 2. Session versioning for password resets
ALTER TABLE users
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;

-- 3. Customer matching on normalised email (NULLs allowed: customers without email never match)
ALTER TABLE customers
    ADD COLUMN email_normalized VARCHAR(150) DEFAULT NULL;

UPDATE customers
SET email_normalized = NULLIF(LOWER(TRIM(email)), '');

ALTER TABLE customers
    ADD CONSTRAINT uk_customer_email_normalized UNIQUE (email_normalized);

-- 4. Each lead points at the customer it converted into (several leads may share one)
ALTER TABLE leads
    ADD COLUMN customer_id BIGINT DEFAULT NULL,
    ADD KEY idx_lead_customer (customer_id),
    ADD CONSTRAINT fk_lead_customer FOREIGN KEY (customer_id) REFERENCES customers (id);

UPDATE leads l
JOIN customers c ON c.lead_id = l.id
SET l.customer_id = c.id;

-- 5. Back-fill the timeline for customers converted before this migration
INSERT INTO audit_logs (lead_id, actor_id, event_type, old_value, new_value, occurred_at)
SELECT c.lead_id,
       COALESCE(l.owner_id, l.created_by),
       'CONVERTED',
       NULL,
       CONCAT('Customer #', c.id),
       c.converted_at
FROM customers c
JOIN leads l ON l.id = c.lead_id;
