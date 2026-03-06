import os

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("citations")

OPENALEX_BASE = "https://api.openalex.org"


def _api_params(extra: dict | None = None) -> dict:
    """Build common query params, injecting API key if set."""
    params = extra or {}
    api_key = os.environ.get("OPENALEX_API_KEY")
    if api_key:
        params["api_key"] = api_key
    return params


def _parse_work(item: dict) -> dict:
    """Convert an OpenAlex work object to a flat paper dict."""
    doi = item.get("doi") or ""
    location = item.get("primary_location") or {}
    url = location.get("landing_page_url") or doi or ""
    authors = [
        a["author"]["display_name"]
        for a in item.get("authorships", [])
        if a.get("author")
    ]
    return {
        "id": doi or item.get("id", ""),
        "title": item.get("title") or "",
        "authors": authors,
        "abstract": "",
        "year": item.get("publication_year"),
        "url": url,
        "source": "openalex",
    }


@mcp.tool()
async def get_citations(paper_id: str, max_results: int = 5) -> list[dict]:
    """Get papers that cite the given paper (by OpenAlex ID, DOI, or arXiv ID)."""
    params = _api_params({
        "filter": f"cites:{paper_id}",
        "per-page": max_results,
        "select": "id,title,authorships,publication_year,doi,primary_location",
    })
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{OPENALEX_BASE}/works", params=params)
        resp.raise_for_status()

    return [_parse_work(item) for item in resp.json().get("results", [])]


@mcp.tool()
async def get_references(paper_id: str, max_results: int = 5) -> list[dict]:
    """Get papers referenced by the given paper (its bibliography)."""
    # Step 1: fetch the paper to get its referenced_works list
    params = _api_params({"select": "referenced_works"})
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{OPENALEX_BASE}/works/{paper_id}", params=params)
        resp.raise_for_status()
        referenced_ids: list[str] = resp.json().get("referenced_works", [])

    if not referenced_ids:
        return []

    # Step 2: fetch details for the first max_results referenced works
    ids_filter = "|".join(referenced_ids[:max_results])
    params = _api_params({
        "filter": f"openalex_id:{ids_filter}",
        "per-page": max_results,
        "select": "id,title,authorships,publication_year,doi,primary_location",
    })
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{OPENALEX_BASE}/works", params=params)
        resp.raise_for_status()

    return [_parse_work(item) for item in resp.json().get("results", [])]


def main():
    mcp.run()


if __name__ == "__main__":
    main()
