import os
import xml.etree.ElementTree as ET

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("papers")

ARXIV_NS = "http://www.w3.org/2005/Atom"


def _in_year_range(year: int | None, year_from: int | None, year_to: int | None) -> bool:
    """Check whether a publication year falls within the specified range.

    Args:
        year: Publication year to check, or None if unknown.
        year_from: Start of year range (inclusive), or None for no lower bound.
        year_to: End of year range (inclusive), or None for no upper bound.

    Returns:
        True if the year is within range; False if year is None or out of range.
    """
    if year is None:
        return False
    if year_from is not None and year < year_from:
        return False
    if year_to is not None and year > year_to:
        return False
    return True


@mcp.tool()
async def search_arxiv(
    query: str,
    max_results: int = 5,
    sort_by_date: bool = False,
    year_from: int | None = None,
    year_to: int | None = None,
) -> list[dict]:
    """Search academic papers on arXiv.

    Queries the arXiv API and returns paper metadata. When year filters are
    active, fetches extra results (4x max_results) to compensate for filtering.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return (default 5).
        sort_by_date: If True, sort by submission date descending.
        year_from: Only include papers published in or after this year.
        year_to: Only include papers published in or before this year.

    Returns:
        List of paper dicts with keys: id (arXiv ID), title, authors,
        abstract, year, url, source ("arxiv").
    """
    # Fetch extra results when year-filtering so we have enough after the filter
    fetch_count = max_results * 4 if (year_from or year_to) else max_results

    params: dict = {"search_query": query, "max_results": fetch_count}
    if sort_by_date:
        params["sortBy"] = "submittedDate"
        params["sortOrder"] = "descending"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("https://export.arxiv.org/api/query", params=params)
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

        if (year_from or year_to) and not _in_year_range(year, year_from, year_to):
            continue

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

        if len(papers) == max_results:
            break

    return papers


def _reconstruct_abstract(inverted_index: dict | None) -> str:
    """Reconstruct plain text from OpenAlex's inverted index abstract format.

    OpenAlex stores abstracts as {word: [position, ...]} dictionaries.
    This function sorts words by position and joins them into a sentence.

    Args:
        inverted_index: Dict mapping words to lists of integer positions,
            or None if no abstract is available.

    Returns:
        Reconstructed abstract text, or empty string if input is None.
    """
    if not inverted_index:
        return ""
    positions: dict[int, str] = {}
    for word, pos_list in inverted_index.items():
        for pos in pos_list:
            positions[pos] = word
    return " ".join(positions[p] for p in sorted(positions))


@mcp.tool()
async def search_openalex(
    query: str,
    max_results: int = 5,
    sort_by_date: bool = False,
    year_from: int | None = None,
    year_to: int | None = None,
) -> list[dict]:
    """Search academic papers on OpenAlex.

    Queries the OpenAlex API and returns paper metadata. Abstracts are
    reconstructed from OpenAlex's inverted index format.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return (default 5).
        sort_by_date: If True, sort by publication date descending.
        year_from: Only include papers published in or after this year.
        year_to: Only include papers published in or before this year.

    Returns:
        List of paper dicts with keys: id (DOI or OpenAlex URL), title,
        authors, abstract, year, url, source ("openalex").
    """
    params: dict = {
        "search": query,
        "per-page": max_results,
        "select": "id,title,authorships,abstract_inverted_index,publication_year,doi,primary_location",
    }

    if sort_by_date:
        params["sort"] = "publication_date:desc"

    filters: list[str] = []
    if year_from and year_to:
        filters.append(f"publication_year:{year_from}-{year_to}")
    elif year_from:
        filters.append(f"publication_year:>{year_from - 1}")
    elif year_to:
        filters.append(f"publication_year:<{year_to + 1}")
    if filters:
        params["filter"] = ",".join(filters)

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
