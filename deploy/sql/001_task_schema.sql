CREATE TABLE IF NOT EXISTS agent_tasks (
    task_id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    input_files JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_files JSONB NOT NULL DEFAULT '{}'::jsonb,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_updated_at
    ON agent_tasks (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_by_created_at
    ON agent_tasks (created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_task_events (
    event_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES agent_tasks(task_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_task_events_task_created_at
    ON agent_task_events (task_id, created_at ASC);

CREATE TABLE IF NOT EXISTS agent_file_artifacts (
    artifact_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES agent_tasks(task_id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    path TEXT NOT NULL,
    exists BOOLEAN NOT NULL DEFAULT FALSE,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    sha256 TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_file_artifacts_task_role
    ON agent_file_artifacts (task_id, role);

CREATE TABLE IF NOT EXISTS agent_knowledge_bases (
    knowledge_base_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artifact_file TEXT NOT NULL,
    manifest_file TEXT NOT NULL,
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    artifact_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    workbook_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_knowledge_bases_name
    ON agent_knowledge_bases (name);

CREATE TABLE IF NOT EXISTS agent_capability_registry (
    capability_key TEXT PRIMARY KEY,
    capability_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_capability_registry_type
    ON agent_capability_registry (capability_type, enabled);

CREATE TABLE IF NOT EXISTS agent_model_routes (
    route_key TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_model_routes_purpose_priority
    ON agent_model_routes (purpose, priority, enabled);
