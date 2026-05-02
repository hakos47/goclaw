-- Migration 000063_embedding_dimension_1024.up.sql
-- Migrates embedding columns from vector(1536) to vector(1024) for snowflake-arctic-embed2 compatibility.

-- 1. Drop existing HNSW indexes
DROP INDEX IF EXISTS idx_skills_embedding;
DROP INDEX IF EXISTS idx_agents_embedding;
DROP INDEX IF EXISTS idx_mem_vec;
DROP INDEX IF EXISTS idx_vault_docs_embedding;
DROP INDEX IF EXISTS idx_tt_embedding;
DROP INDEX IF EXISTS idx_kg_entity_vec;
DROP INDEX IF EXISTS idx_episodic_vec;
DROP INDEX IF EXISTS idx_episodic_embedding_hnsw;

-- 2. Clear existing embeddings (USING NULL) to avoid casting errors and change dimension to 1024
ALTER TABLE skills ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE agents ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE memory_chunks ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE vault_documents ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE team_tasks ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE kg_entities ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE episodic_summaries ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE embedding_cache ALTER COLUMN embedding TYPE vector(1024) USING NULL;

-- 3. Recreate the HNSW indexes
CREATE INDEX idx_skills_embedding ON public.skills USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_agents_embedding ON public.agents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_mem_vec ON public.memory_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_vault_docs_embedding ON public.vault_documents USING hnsw (embedding vector_cosine_ops) WITH (m='16', ef_construction='64');
CREATE INDEX idx_tt_embedding ON public.team_tasks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_kg_entity_vec ON public.kg_entities USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_episodic_embedding_hnsw ON public.episodic_summaries USING hnsw (embedding vector_cosine_ops) WITH (m='16', ef_construction='64') WHERE (embedding IS NOT NULL);