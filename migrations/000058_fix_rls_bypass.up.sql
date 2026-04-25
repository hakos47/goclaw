-- 000058_fix_rls_bypass.up.sql
-- Fix RLS policy to correctly handle NULL current_setting during bypass.
-- PostgreSQL current_setting(..., true) returns NULL if missing, not empty string.

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'agents', 'sessions', 'api_keys', 'agent_shares', 'user_context_files',
        'user_agent_profiles', 'user_agent_overrides', 'agent_config_permissions',
        'agent_links', 'channel_instances', 'memory_documents', 'memory_chunks',
        'kg_entities', 'kg_relations', 'skills', 'skill_user_grants', 'cron_jobs',
        'traces', 'activity_logs', 'usage_snapshots', 'mcp_servers', 'mcp_user_grants',
        'mcp_access_requests', 'agent_teams', 'team_user_grants', 'pairing_requests',
        'paired_devices', 'channel_pending_messages', 'channel_contacts', 'llm_providers',
        'config_secrets', 'secure_cli_binaries', 'agent_context_files', 'skill_agent_grants',
        'mcp_agent_grants', 'team_tasks', 'spans', 'embedding_cache', 'agent_team_members',
        'team_task_comments', 'team_task_events', 'team_task_attachments', 'tenant_users',
        'system_configs', 'kg_dedup_candidates', 'secure_cli_user_credentials', 'subagent_tasks',
        'secure_cli_agent_grants', 'episodic_summaries', 'agent_evolution_metrics',
        'agent_evolution_suggestions', 'vault_documents', 'hooks'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I USING (
            tenant_id::text = current_setting(''app.current_tenant'', true)
            OR COALESCE(current_setting(''app.current_tenant'', true), '''') = ''''
        )', t);
    END LOOP;
END $$;
