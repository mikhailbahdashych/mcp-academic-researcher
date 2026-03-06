import xml.etree.ElementTree as ET

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("papers")

ARXIV_NS = "http://www.w3.org/2005/Atom"


@mcp.tool()
async def search_arxiv(query: str, max_results: int = 5) -> list[dict]:
    """Search academic papers on arXiv."""
    url = f"http://export.arxiv.org/api/query?search_query={query}&max_results={max_results}"
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


def main():
    mcp.run()


if __name__ == "__main__":
    main()
