-- Tank Advisor daily quest completions (documentation; JPA ddl-auto may apply schema)
CREATE TABLE IF NOT EXISTS tank_quest_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    tank_id BIGINT NOT NULL REFERENCES tanks(id),
    quest_key VARCHAR(64) NOT NULL,
    quest_date DATE NOT NULL,
    source VARCHAR(16) NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tank_id, quest_key, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_quest_user_tank_date ON tank_quest_completions(user_id, tank_id, quest_date);
