import os
import xml.etree.ElementTree as ET

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("papers")

ARXIV_NS = "http://www.w3.org/2005/Atom"


@mcp.tool()
async def search_arxiv(query: str, max_results: int = 5) -> list[dict]:
    """Search academic papers on arXiv."""
    url = f"https://export.arxiv.org/api/query?search_query={query}&max_results={max_results}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)
    papers = []
    for entry in root.findall(f"{{{ARXIV_NS}}}entry"):
        paper_id_url = entry.findtext(f"{{{ARXIV_NS}}}id", "")
        arxiv_id = paper_id_url.rstrip("/").split("/")[-1]

        authors = [
            author.findtext(f"{{{ARXIV_NS}}}name", "")
            for author in entry.findall(f"{{{ARXIV_NS}}}author")
        ]

        published = entry.findtext(f"{{{ARXIV_NS}}}published", "")
        year = int(published[:4]) if published else None

        papers.append(
            {
                "id": arxiv_id,
                "title": (entry.findtext(f"{{{ARXIV_NS}}}title", "") or "").strip(),
                "authors": authors,
                "abstract": (entry.findtext(f"{{{ARXIV_NS}}}summary", "") or "").strip(),
                "year": year,
                "url": paper_id_url,
                "source": "arxiv",
            }
        )
    return papers


def _reconstruct_abstract(inverted_index: dict | None) -> str:
    """OpenAlex stores abstracts as {word: [position, ...]} — reconstruct to plain text."""
    if not inverted_index:
        return ""
    positions: dict[int, str] = {}
    for word, pos_list in inverted_index.items():
        for pos in pos_list:
            positions[pos] = word
    return " ".join(positions[p] for p in sorted(positions))


@mcp.tool()
async def search_openalex(query: str, max_results: int = 5) -> list[dict]:
    """Search academic papers on OpenAlex."""
    params: dict = {
        "search": query,
        "per-page": max_results,
        "select": "id,title,authorships,abstract_inverted_index,publication_year,doi,primary_location",
    }
    api_key = os.environ.get("OPENALEX_API_KEY")
    if api_key:
        params["api_key"] = api_key

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("https://api.openalex.org/works", params=params)
        resp.raise_for_status()

    papers = []
    for item in resp.json().get("results", []):
        doi = item.get("doi") or ""
        location = item.get("primary_location") or {}
        paper_url = location.get("landing_page_url") or doi or ""
        authors = [
            a["author"]["display_name"]
            for a in item.get("authorships", [])
            if a.get("author")
        ]
        papers.append(
            {
                "id": doi or item.get("id", ""),
                "title": item.get("title") or "",
                "authors": authors,
                "abstract": _reconstruct_abstract(item.get("abstract_inverted_index")),
                "year": item.get("publication_year"),
                "url": paper_url,
                "source": "openalex",
            }
        )
    return papers


def main():
    mcp.run()


if __name__ == "__main__":
    main()
