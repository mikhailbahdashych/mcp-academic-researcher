"""Shared data models for the MCP Academic Researcher Python workspace."""

from pydantic import BaseModel


class Paper(BaseModel):
    """Represents an academic paper from a search source.

    Attributes:
        id: Unique identifier (arXiv ID or DOI).
        title: Paper title.
        authors: List of author display names.
        abstract: Paper abstract text.
        year: Publication year, or None if unknown.
        url: URL to the paper's landing page or PDF.
        source: Data source identifier ("arxiv" or "openalex").
    """

    id: str
    title: str
    authors: list[str]
    abstract: str
    year: int | None = None
    url: str
    source: str
