erDiagram
    USERS ||--o{ LEADS : creates
    USERS ||--o{ LEADS : owns
    USERS ||--o{ FOLLOW_UPS : creates
    USERS ||--o{ FOLLOW_UPS : assigned_to
    USERS ||--o{ ACTIVITIES : performs
    USERS ||--o{ AUDIT_LOGS : performs

    LEADS ||--o{ FOLLOW_UPS : has
    LEADS ||--o{ ACTIVITIES : has
    LEADS ||--o{ AUDIT_LOGS : records
    LEADS ||--o| CUSTOMERS : converts_to

    USERS {
        bigint id PK
        string full_name
        string email
        string password_hash
        string role
        datetime created_at
        datetime updated_at
    }

    LEADS {
        bigint id PK
        string name
        string company
        string email
        string email_normalized
        string phone
        string phone_normalized
        string source
        string priority
        string status
        bigint owner_id FK
        bigint created_by FK
        decimal deal_value
        string loss_reason
        datetime created_at
        datetime updated_at
        bigint version
    }

    FOLLOW_UPS {
        bigint id PK
        bigint lead_id FK
        bigint created_by FK
        bigint assigned_to FK
        string type
        string title
        string description
        datetime due_at
        datetime completed_at
        datetime created_at
    }

    ACTIVITIES {
        bigint id PK
        bigint lead_id FK
        bigint actor_id FK
        string type
        string description
        datetime created_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint lead_id FK
        bigint actor_id FK
        string event_type
        string old_value
        string new_value
        datetime occurred_at
    }

    CUSTOMERS {
        bigint id PK
        bigint lead_id FK
        string name
        string company
        string email
        string phone
        datetime converted_at
    }