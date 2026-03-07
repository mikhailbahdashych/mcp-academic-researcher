FROM python:3.12-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace root + required members
COPY pyproject.toml uv.lock ./
COPY shared ./shared
COPY orchestrator ./orchestrator
COPY mcp_servers/papers ./mcp_servers/papers
COPY mcp_servers/citations ./mcp_servers/citations
COPY mcp_servers/notes ./mcp_servers/notes
COPY mcp_servers/files/pyproject.toml ./mcp_servers/files/pyproject.toml

# Install all workspace members and their deps
RUN uv sync --frozen --no-dev --all-packages

EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "orchestrator.main:app", "--host", "0.0.0.0", "--port", "8000"]
