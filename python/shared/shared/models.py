from pydantic import BaseModel


class Paper(BaseModel):
    id: str
    title: str
    authors: list[str]
    abstract: str
    year: int | None = None
    url: str
    source: str  # "arxiv" | "semantic_scholar"
