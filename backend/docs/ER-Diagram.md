erDiagram
    USERS ||--o{ LEADS : owns
    USERS ||--o{ LEADS : creates
    USERS ||--o{ FOLLOW_UPS : creates
    USERS ||--o{ FOLLOW_UPS : assigned_to
    USERS ||--o{ ACTIVITIES : performs
    USERS ||--o{ AUDIT_LOGS : performs

    LEADS ||--o{ FOLLOW_UPS : has
    LEADS ||--o{ ACTIVITIES : has
    LEADS ||--o{ AUDIT_LOGS : records

    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar role
        datetime created_at
        datetime updated_at
    }

    LEADS {
        bigint id PK
        varchar name
        varchar company
        varchar email
        varchar email_normalized
        varchar phone
        varchar phone_normalized
        varchar source
        varchar priority
        varchar status
        bigint owner_id FK
        bigint created_by FK
        decimal deal_value
        varchar loss_reason
        datetime created_at
        datetime updated_at
        bigint version
    }

    FOLLOW_UPS {
        bigint id PK
        bigint lead_id FK
        bigint created_by FK
        bigint assigned_to FK
        varchar type
        varchar title
        varchar description
        datetime due_at
        datetime completed_at
        datetime created_at
    }

    ACTIVITIES {
        bigint id PK
        bigint lead_id FK
        bigint actor_id FK
        varchar type
        varchar description
        datetime created_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint lead_id FK
        bigint actor_id FK
        varchar event_type
        varchar old_value
        varchar new_value
        datetime occurred_at
    }