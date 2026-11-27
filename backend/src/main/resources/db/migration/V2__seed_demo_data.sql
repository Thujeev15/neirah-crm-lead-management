-- V2: Synthetic demonstration data for Neirah CRM.
-- All people, companies, emails and phone numbers below are fictional.
-- Demo password for every seeded account: Demo@1234 (BCrypt hashed).
-- Dates are relative to NOW() so overdue/upcoming follow-ups stay meaningful
-- whenever the database is initialised.

SET @pwd = '$2a$10$/JVjlWt7w6/p7xMPVsY/G.GXLOto7kooEqoosuVVmf.UrXTgKHIOK';

-- ---------------------------------------------------------------------------
-- Users: 1 manager, 3 sales representatives
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO users (full_name, email, password_hash, role, created_at, updated_at) VALUES
    ('Maya Manager',  'manager@neirah.demo', @pwd, 'MANAGER',   NOW(6) - INTERVAL 30 DAY, NOW(6) - INTERVAL 30 DAY),
    ('Ravi Perera',   'ravi@neirah.demo',    @pwd, 'SALES_REP', NOW(6) - INTERVAL 30 DAY, NOW(6) - INTERVAL 30 DAY),
    ('Nisha Fernando','nisha@neirah.demo',   @pwd, 'SALES_REP', NOW(6) - INTERVAL 30 DAY, NOW(6) - INTERVAL 30 DAY),
    ('Arun Silva',    'arun@neirah.demo',    @pwd, 'SALES_REP', NOW(6) - INTERVAL 30 DAY, NOW(6) - INTERVAL 30 DAY);

SET @mgr   = (SELECT id FROM users WHERE email = 'manager@neirah.demo');
SET @ravi  = (SELECT id FROM users WHERE email = 'ravi@neirah.demo');
SET @nisha = (SELECT id FROM users WHERE email = 'nisha@neirah.demo');
SET @arun  = (SELECT id FROM users WHERE email = 'arun@neirah.demo');

-- ---------------------------------------------------------------------------
-- Leads across every pipeline stage
-- ---------------------------------------------------------------------------

-- NEW
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Kasun Jayawardena', 'Lotus Retail (Demo)', 'kasun@lotusretail.example', 'kasun@lotusretail.example',
        '+94 77 100 0001', '94771000001', 'WEBSITE', 'HIGH', 'NEW',
        NULL, NULL, @mgr, @ravi, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY, 0);
SET @l_new1 = LAST_INSERT_ID();

INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Dilini Wickrama', 'Harbour Logistics (Demo)', 'dilini@harbourlog.example', 'dilini@harbourlog.example',
        NULL, NULL, 'REFERRAL', 'MEDIUM', 'NEW',
        NULL, NULL, @nisha, @nisha, NOW(6) - INTERVAL 1 DAY, NOW(6) - INTERVAL 1 DAY, 0);
SET @l_new2 = LAST_INSERT_ID();

INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Tharindu Bandara', NULL, NULL, NULL,
        '077-100-0003', '0771000003', 'CALL', 'LOW', 'NEW',
        NULL, NULL, @arun, @arun, NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR, 0);
SET @l_new3 = LAST_INSERT_ID();

-- CONTACTED
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Shanika Gunasekara', 'BlueWave Media (Demo)', 'shanika@bluewave.example', 'shanika@bluewave.example',
        '+94 71 200 0004', '94712000004', 'CAMPAIGN', 'MEDIUM', 'CONTACTED',
        NULL, NULL, @mgr, @ravi, NOW(6) - INTERVAL 8 DAY, NOW(6) - INTERVAL 6 DAY, 0);
SET @l_con1 = LAST_INSERT_ID();

INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Isuru Rathnayake', 'Spice Route Foods (Demo)', 'isuru@spiceroute.example', 'isuru@spiceroute.example',
        '+94 76 200 0005', '94762000005', 'WEBSITE', 'HIGH', 'CONTACTED',
        NULL, NULL, @nisha, @nisha, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 5 DAY, 0);
SET @l_con2 = LAST_INSERT_ID();

-- QUALIFIED
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Malini Herath', 'Ceylon Tea Traders (Demo)', 'malini@ceylontea.example', 'malini@ceylontea.example',
        '+94 75 300 0006', '94753000006', 'REFERRAL', 'HIGH', 'QUALIFIED',
        NULL, NULL, @mgr, @arun, NOW(6) - INTERVAL 14 DAY, NOW(6) - INTERVAL 4 DAY, 0);
SET @l_qua1 = LAST_INSERT_ID();

-- PROPOSAL_SENT
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Pradeep Senanayake', 'Kandy Hotels Group (Demo)', 'pradeep@kandyhotels.example', 'pradeep@kandyhotels.example',
        '+94 77 400 0007', '94774000007', 'CAMPAIGN', 'HIGH', 'PROPOSAL_SENT',
        NULL, NULL, @mgr, @ravi, NOW(6) - INTERVAL 20 DAY, NOW(6) - INTERVAL 2 DAY, 0);
SET @l_pro1 = LAST_INSERT_ID();

INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Anjali Kumari', 'Galle Fort Designs (Demo)', 'anjali@gallefort.example', 'anjali@gallefort.example',
        '+94 71 400 0008', '94714000008', 'WEBSITE', 'MEDIUM', 'PROPOSAL_SENT',
        NULL, NULL, @nisha, @nisha, NOW(6) - INTERVAL 18 DAY, NOW(6) - INTERVAL 3 DAY, 0);
SET @l_pro2 = LAST_INSERT_ID();

-- WON (one already converted, one ready to convert during the demo)
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Ruwan Dissanayake', 'Colombo Motors (Demo)', 'ruwan@colombomotors.example', 'ruwan@colombomotors.example',
        '+94 77 500 0009', '94775000009', 'REFERRAL', 'HIGH', 'WON',
        450000.00, NULL, @mgr, @ravi, NOW(6) - INTERVAL 28 DAY, NOW(6) - INTERVAL 5 DAY, 0);
SET @l_won1 = LAST_INSERT_ID();

INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Sachini Abeysekara', 'Island Pharma (Demo)', 'sachini@islandpharma.example', 'sachini@islandpharma.example',
        '+94 76 500 0010', '94765000010', 'CAMPAIGN', 'MEDIUM', 'WON',
        180000.00, NULL, @arun, @arun, NOW(6) - INTERVAL 25 DAY, NOW(6) - INTERVAL 1 DAY, 0);
SET @l_won2 = LAST_INSERT_ID();

-- LOST
INSERT INTO leads (name, company, email, email_normalized, phone, phone_normalized, source, priority, status,
                   deal_value, loss_reason, created_by, owner_id, created_at, updated_at, version)
VALUES ('Chamara Weerasinghe', 'Northern Textiles (Demo)', 'chamara@northtex.example', 'chamara@northtex.example',
        '+94 75 600 0011', '94756000011', 'CALL', 'LOW', 'LOST',
        NULL, 'Chose a competitor with a lower price', @mgr, @nisha, NOW(6) - INTERVAL 22 DAY, NOW(6) - INTERVAL 10 DAY, 0);
SET @l_lost1 = LAST_INSERT_ID();

-- ---------------------------------------------------------------------------
-- Converted customer for the first WON lead
-- ---------------------------------------------------------------------------
INSERT INTO customers (lead_id, name, company, email, phone, converted_at)
VALUES (@l_won1, 'Ruwan Dissanayake', 'Colombo Motors (Demo)', 'ruwan@colombomotors.example', '+94 77 500 0009',
        NOW(6) - INTERVAL 4 DAY);

-- ---------------------------------------------------------------------------
-- Audit history (ownership + pipeline transitions)
-- ---------------------------------------------------------------------------
INSERT INTO audit_logs (lead_id, actor_id, event_type, old_value, new_value, occurred_at) VALUES
    (@l_new1, @mgr,  'OWNER_CHANGED',  'manager@neirah.demo', 'ravi@neirah.demo', NOW(6) - INTERVAL 2 DAY),

    (@l_con1, @mgr,  'OWNER_CHANGED',  'manager@neirah.demo', 'ravi@neirah.demo', NOW(6) - INTERVAL 8 DAY),
    (@l_con1, @ravi, 'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 6 DAY),

    (@l_con2, @nisha,'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 5 DAY),

    (@l_qua1, @mgr,  'OWNER_CHANGED',  'manager@neirah.demo', 'nisha@neirah.demo', NOW(6) - INTERVAL 14 DAY),
    (@l_qua1, @nisha,'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 12 DAY),
    (@l_qua1, @mgr,  'OWNER_CHANGED',  'nisha@neirah.demo', 'arun@neirah.demo', NOW(6) - INTERVAL 9 DAY),
    (@l_qua1, @arun, 'STATUS_CHANGED', 'CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 4 DAY),

    (@l_pro1, @mgr,  'OWNER_CHANGED',  'manager@neirah.demo', 'ravi@neirah.demo', NOW(6) - INTERVAL 20 DAY),
    (@l_pro1, @ravi, 'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 17 DAY),
    (@l_pro1, @ravi, 'STATUS_CHANGED', 'CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 10 DAY),
    (@l_pro1, @ravi, 'STATUS_CHANGED', 'QUALIFIED', 'PROPOSAL_SENT', NOW(6) - INTERVAL 2 DAY),

    (@l_pro2, @nisha,'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 15 DAY),
    (@l_pro2, @nisha,'STATUS_CHANGED', 'CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 9 DAY),
    (@l_pro2, @nisha,'STATUS_CHANGED', 'QUALIFIED', 'PROPOSAL_SENT', NOW(6) - INTERVAL 3 DAY),

    (@l_won1, @mgr,  'OWNER_CHANGED',  'manager@neirah.demo', 'ravi@neirah.demo', NOW(6) - INTERVAL 28 DAY),
    (@l_won1, @ravi, 'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 25 DAY),
    (@l_won1, @ravi, 'STATUS_CHANGED', 'CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 18 DAY),
    (@l_won1, @ravi, 'STATUS_CHANGED', 'QUALIFIED', 'PROPOSAL_SENT', NOW(6) - INTERVAL 12 DAY),
    (@l_won1, @ravi, 'STATUS_CHANGED', 'PROPOSAL_SENT', 'WON', NOW(6) - INTERVAL 5 DAY),

    (@l_won2, @arun, 'STATUS_CHANGED', 'NEW', 'CONTACTED', NOW(6) - INTERVAL 22 DAY),
    (@l_won2, @arun, 'STATUS_CHANGED', 'CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 15 DAY),
    (@l_won2, @arun, 'STATUS_CHANGED', 'QUALIFIED', 'PROPOSAL_SENT', NOW(6) - INTERVAL 8 DAY),
    (@l_won2, @arun, 'STATUS_CHANGED', 'PROPOSAL_SENT', 'WON', NOW(6) - INTERVAL 1 DAY),

    (@l_lost1, @mgr, 'OWNER_CHANGED',  'manager@neirah.demo', 'nisha@neirah.demo', NOW(6) - INTERVAL 22 DAY),
    (@l_lost1, @nisha,'STATUS_CHANGED','NEW', 'CONTACTED', NOW(6) - INTERVAL 20 DAY),
    (@l_lost1, @nisha,'STATUS_CHANGED','CONTACTED', 'QUALIFIED', NOW(6) - INTERVAL 15 DAY),
    (@l_lost1, @nisha,'STATUS_CHANGED','QUALIFIED', 'LOST', NOW(6) - INTERVAL 10 DAY);

-- ---------------------------------------------------------------------------
-- Activity timeline entries
-- ---------------------------------------------------------------------------
INSERT INTO activities (lead_id, actor_id, type, description, created_at) VALUES
    (@l_con1, @ravi,  'CALL',    'Intro call. Interested in a quarterly media package.', NOW(6) - INTERVAL 6 DAY),
    (@l_con2, @nisha, 'NOTE',    'Requested pricing sheet by email.', NOW(6) - INTERVAL 5 DAY),
    (@l_qua1, @nisha, 'MEETING', 'Discovery meeting with procurement team.', NOW(6) - INTERVAL 11 DAY),
    (@l_qua1, @arun,  'NOTE',    'Took over account after reassignment; reviewed previous notes.', NOW(6) - INTERVAL 8 DAY),
    (@l_pro1, @ravi,  'MEETING', 'Presented proposal to the operations director.', NOW(6) - INTERVAL 2 DAY),
    (@l_pro2, @nisha, 'CALL',    'Clarified delivery timelines in proposal.', NOW(6) - INTERVAL 3 DAY),
    (@l_won1, @ravi,  'NOTE',    'Contract signed for 12 months.', NOW(6) - INTERVAL 5 DAY),
    (@l_won2, @arun,  'CALL',    'Verbal approval received; PO to follow.', NOW(6) - INTERVAL 1 DAY),
    (@l_lost1,@nisha, 'NOTE',    'Client selected competitor on price.', NOW(6) - INTERVAL 10 DAY);

-- ---------------------------------------------------------------------------
-- Follow-ups: overdue, upcoming and completed
-- ---------------------------------------------------------------------------
INSERT INTO follow_ups (lead_id, created_by, assigned_to, type, title, description, due_at, completed_at, created_at) VALUES
    -- Overdue (past due, not completed)
    (@l_new1, @mgr,   @ravi,  'CALL',    'First contact call',            'Introduce Neirah CRM offering.',   NOW(6) - INTERVAL 1 DAY,  NULL, NOW(6) - INTERVAL 2 DAY),
    (@l_con2, @nisha, @nisha, 'TASK',    'Send pricing sheet',            'Customer asked for PDF pricing.',  NOW(6) - INTERVAL 3 DAY,  NULL, NOW(6) - INTERVAL 5 DAY),
    (@l_qua1, @arun,  @arun,  'MEETING', 'Requirements workshop',         NULL,                                NOW(6) - INTERVAL 2 HOUR, NULL, NOW(6) - INTERVAL 4 DAY),

    -- Upcoming
    (@l_con1, @ravi,  @ravi,  'MEETING', 'Product demo',                  'Demo to marketing team.',          NOW(6) + INTERVAL 2 DAY,  NULL, NOW(6) - INTERVAL 1 DAY),
    (@l_pro1, @ravi,  @ravi,  'CALL',    'Proposal follow-up call',       NULL,                                NOW(6) + INTERVAL 1 DAY,  NULL, NOW(6) - INTERVAL 2 DAY),
    (@l_pro2, @nisha, @nisha, 'CALL',    'Negotiate final pricing',       NULL,                                NOW(6) + INTERVAL 4 DAY,  NULL, NOW(6) - INTERVAL 3 DAY),
    (@l_new3, @arun,  @arun,  'TASK',    'Collect email address',         'Lead has no email on record.',     NOW(6) + INTERVAL 6 HOUR, NULL, NOW(6) - INTERVAL 3 HOUR),

    -- Completed (one completed after its due date, so it must NOT count as overdue)
    (@l_won1, @ravi,  @ravi,  'TASK',    'Send contract',                 NULL,                                NOW(6) - INTERVAL 7 DAY,  NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 9 DAY),
    (@l_won2, @arun,  @arun,  'MEETING', 'Closing meeting',               NULL,                                NOW(6) - INTERVAL 2 DAY,  NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 5 DAY);
