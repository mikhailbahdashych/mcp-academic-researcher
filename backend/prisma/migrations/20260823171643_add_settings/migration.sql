-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "llm_provider" TEXT NOT NULL DEFAULT 'ollama',
    "ollama_base_url" TEXT NOT NULL DEFAULT 'http://localhost:11434',
    "ollama_model" TEXT NOT NULL DEFAULT 'qwen2.5:7b',
    "anthropic_model" TEXT NOT NULL DEFAULT 'claude-opus-5',
    "anthropic_api_key" TEXT,
    "updated_at" DATETIME NOT NULL
);
